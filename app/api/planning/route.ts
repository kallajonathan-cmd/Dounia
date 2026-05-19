import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user.id).single()
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || new Date().toISOString().split('T')[0]
    const to = searchParams.get('to') || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

    const { data: chantiers } = await supabase
      .from('chantiers')
      .select('*, clients(nom), chantier_lots(*)')
      .eq('societe_id', profile?.societe_id || '')
      .not('statut', 'eq', 'annule')
      .or(`date_debut_prevue.gte.${from},date_fin_prevue.lte.${to},date_debut_prevue.is.null`)

    return NextResponse.json({
      chantiers: chantiers || [],
      period: { from, to },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
