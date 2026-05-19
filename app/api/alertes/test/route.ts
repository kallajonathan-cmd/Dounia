import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user.id).single()

    const body = await request.json()
    const { type = 'info', titre = 'Test', message = 'Ceci est une alerte de test' } = body

    const { data, error } = await supabase.from('alertes').insert({
      societe_id: profile?.societe_id,
      type: 'test',
      niveau: type,
      titre,
      message,
      destinataire_id: user.id,
      lue: false,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, alerte: data })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
