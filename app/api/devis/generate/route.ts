import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `Tu es un métreur expérimenté qui aide un artisan du BTP à transformer une description orale de travaux en devis structuré, poste par poste, pour le marché français.

Règles :
- Découpe la description en lignes de devis, une par poste (ex : "Dépose de l'ancien carrelage", "Fourniture et pose de carrelage 60x60", "Main d'œuvre plomberie", ...).
- Si plusieurs corps de métier ou zones sont mentionnés, introduis chacun par une ligne de type "section" (ex: "Lot plomberie"), sans quantité ni prix.
- Pour chaque ligne de type "prestation" ou "fourniture", déduis une unité réaliste (m², m³, ml, u, h, forfait...), une quantité (à partir du texte, ou une estimation raisonnable si non précisée), et un prix unitaire HT réaliste pour le marché du bâtiment en France si l'utilisateur n'en donne pas.
- Le taux de TVA est 20 par défaut, sauf mention explicite de travaux d'amélioration/rénovation énergétique dans un logement de plus de 2 ans (10) ou de rénovation énergétique éligible au taux réduit (5.5).
- Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après, aucun bloc markdown), au format exact suivant :
{
  "objet": "résumé court de l'objet du devis",
  "type_travaux": "type de travaux principal",
  "lignes": [
    { "type": "section" | "prestation" | "fourniture", "designation": "...", "description": "...", "unite": "...", "quantite": 0, "prix_unitaire_ht": 0, "taux_tva": 20 }
  ]
}
Pour les lignes de type "section", quantite et prix_unitaire_ht valent 0.`

interface LigneBrute {
  type?: string
  designation?: string
  description?: string
  unite?: string
  quantite?: number
  prix_unitaire_ht?: number
  taux_tva?: number
}

function extractJson(text: string): any {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Réponse IA invalide')
  return JSON.parse(cleaned.slice(start, end + 1))
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const description: string = (body.description || '').trim()
    if (!description) {
      return NextResponse.json({ error: 'Description des travaux manquante' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Génération IA non configurée : la variable d'environnement ANTHROPIC_API_KEY est manquante." },
        { status: 500 }
      )
    }

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: description }],
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return NextResponse.json({ error: `Erreur IA : ${errText}` }, { status: 502 })
    }

    const aiData = await aiResponse.json()
    const text = aiData?.content?.[0]?.text || ''
    const parsed = extractJson(text)

    const lignesBrutes: LigneBrute[] = Array.isArray(parsed.lignes) ? parsed.lignes : []
    let montantHT = 0
    const lignes = lignesBrutes.map((l, i) => {
      const isSection = l.type === 'section'
      const quantite = isSection ? 0 : Number(l.quantite) || 0
      const prix_unitaire_ht = isSection ? 0 : Number(l.prix_unitaire_ht) || 0
      const montant_ht = Math.round(quantite * prix_unitaire_ht * 100) / 100
      if (!isSection) montantHT += montant_ht
      return {
        position: i + 1,
        type: isSection ? 'section' : (l.type === 'fourniture' ? 'fourniture' : 'prestation'),
        designation: l.designation || '',
        description: l.description || '',
        unite: l.unite || 'forfait',
        quantite,
        prix_unitaire_ht,
        taux_tva: Number(l.taux_tva) || 20,
        montant_ht,
      }
    })

    const tauxTva = lignes.find(l => l.type !== 'section')?.taux_tva || 20
    const montantTva = Math.round(montantHT * tauxTva) / 100
    const montantTtc = Math.round((montantHT + montantTva) * 100) / 100

    const generatedDevis = {
      objet: parsed.objet || 'Devis travaux',
      type_travaux: parsed.type_travaux || '',
      lignes,
      montant_ht: Math.round(montantHT * 100) / 100,
      taux_tva: tauxTva,
      montant_tva: montantTva,
      montant_ttc: montantTtc,
    }

    return NextResponse.json({ success: true, devis: generatedDevis })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
