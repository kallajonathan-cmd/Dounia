import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user.id).single()
    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut')
    const clientId = searchParams.get('client_id')

    let query = supabase.from('devis').select('*, clients(nom)').eq('societe_id', profile?.societe_id || '').order('created_at', { ascending: false })
    if (statut) query = query.eq('statut', statut)
    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user.id).single()
    const body = await request.json()

    const numero = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

    const { data, error } = await supabase.from('devis').insert({
      ...body,
      societe_id: profile?.societe_id,
      numero,
      statut: 'brouillon',
      created_by: user.id,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
