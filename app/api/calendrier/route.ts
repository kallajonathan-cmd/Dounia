import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user.id).single()
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
    const startOfMonth = `${month}-01`
    const endOfMonth = `${month}-31`

    const [{ data: chantiers }, { data: devis }, { data: factures }] = await Promise.all([
      supabase.from('chantiers').select('id, nom, date_debut_prevue, date_fin_prevue, statut')
        .eq('societe_id', profile?.societe_id || '')
        .or(`date_debut_prevue.gte.${startOfMonth},date_fin_prevue.lte.${endOfMonth}`),
      supabase.from('devis').select('id, objet, date_validite, statut')
        .eq('societe_id', profile?.societe_id || '')
        .gte('date_validite', startOfMonth).lte('date_validite', endOfMonth),
      supabase.from('factures').select('id, objet, date_echeance, statut')
        .eq('societe_id', profile?.societe_id || '')
        .gte('date_echeance', startOfMonth).lte('date_echeance', endOfMonth),
    ])

    return NextResponse.json({
      chantiers: chantiers || [],
      devis: devis || [],
      factures: factures || [],
    })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
