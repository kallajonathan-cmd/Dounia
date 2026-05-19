import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { prompt, client_id, type_travaux } = body

    // AI generation placeholder - would integrate with Claude/OpenAI
    const generatedDevis = {
      objet: `Devis pour ${type_travaux || 'travaux'}`,
      description: prompt || 'Travaux de construction et rénovation',
      lignes: [
        {
          position: 1,
          type: 'section',
          designation: 'MAIN D\'OEUVRE',
          quantite: 1,
          prix_unitaire_ht: 0,
          taux_tva: 20,
          montant_ht: 0,
        },
        {
          position: 2,
          type: 'prestation',
          designation: 'Main d\'oeuvre',
          unite: 'h',
          quantite: 40,
          prix_unitaire_ht: 45,
          taux_tva: 20,
          montant_ht: 1800,
        },
        {
          position: 3,
          type: 'section',
          designation: 'MATERIAUX',
          quantite: 1,
          prix_unitaire_ht: 0,
          taux_tva: 20,
          montant_ht: 0,
        },
        {
          position: 4,
          type: 'prestation',
          designation: 'Fournitures et matériaux',
          unite: 'forfait',
          quantite: 1,
          prix_unitaire_ht: 2500,
          taux_tva: 20,
          montant_ht: 2500,
        },
      ],
      montant_ht: 4300,
      taux_tva: 20,
      montant_tva: 860,
      montant_ttc: 5160,
    }

    return NextResponse.json({
      success: true,
      devis: generatedDevis,
      message: 'Devis généré avec succès',
    })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
