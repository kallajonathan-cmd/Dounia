import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: devis } = await supabase.from('devis').select('*, devis_lignes(*)').eq('id', params.id).single()
    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user.id).single()
    const numero = `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

    const { data: facture, error } = await supabase.from('factures').insert({
      societe_id: profile?.societe_id,
      client_id: devis.client_id,
      devis_id: devis.id,
      numero,
      type: 'facture',
      statut: 'brouillon',
      objet: devis.objet,
      montant_ht: devis.montant_ht,
      taux_tva: devis.taux_tva,
      montant_tva: devis.montant_tva,
      montant_ttc: devis.montant_ttc,
      montant_paye: 0,
      montant_restant: devis.montant_ttc,
      date_emission: new Date().toISOString().split('T')[0],
      conditions_paiement: devis.conditions_paiement,
      created_by: user.id,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (devis.devis_lignes?.length > 0) {
      await supabase.from('facture_lignes').insert(
        devis.devis_lignes.map((l: any, i: number) => ({
          facture_id: facture.id,
          position: l.position || i + 1,
          designation: l.designation,
          description: l.description,
          unite: l.unite,
          quantite: l.quantite,
          prix_unitaire_ht: l.prix_unitaire_ht,
          taux_tva: l.taux_tva,
          montant_ht: l.montant_ht,
        }))
      )
    }

    return NextResponse.json({ success: true, facture_id: facture.id })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
