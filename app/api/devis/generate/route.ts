import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { type_travaux } = body

    const generatedDevis = {
      objet: `Devis pour ${type_travaux || 'travaux'}`,
      lignes: [
        { position: 1, type: 'prestation', designation: 'Main d’œuvre', unite: 'h', quantite: 40, prix_unitaire_ht: 45, taux_tva: 20, montant_ht: 1800 },
        { position: 2, type: 'prestation', designation: 'Fournitures et matériaux', unite: 'forfait', quantite: 1, prix_unitaire_ht: 2500, taux_tva: 20, montant_ht: 2500 },
      ],
      montant_ht: 4300, taux_tva: 20, montant_tva: 860, montant_ttc: 5160,
    }

    return NextResponse.json({ success: true, devis: generatedDevis })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
