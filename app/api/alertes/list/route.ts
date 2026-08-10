import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user.id).single()
    const { searchParams } = new URL(request.url)
    const nonLues = searchParams.get('non_lues') === 'true'

    let query = supabase.from('alertes').select('*').eq('societe_id', profile?.societe_id || '').order('created_at', { ascending: false }).limit(50)
    if (nonLues) query = query.eq('lue', false)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
