import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Geocode a single chantier by address OR save manual coordinates
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => ({}))

    // If manual coordinates provided, save directly
    if (typeof body.latitude === 'number' && typeof body.longitude === 'number') {
      const { error } = await supabase
        .from('chantiers')
        .update({ latitude: body.latitude, longitude: body.longitude })
        .eq('id', params.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, latitude: body.latitude, longitude: body.longitude, source: 'manual' })
    }

    // Otherwise geocode from address
    const { data: chantier } = await supabase
      .from('chantiers')
      .select('adresse, code_postal, ville')
      .eq('id', params.id)
      .single()

    if (!chantier) return NextResponse.json({ error: 'Chantier introuvable' }, { status: 404 })

    const address = [chantier.adresse, chantier.code_postal, chantier.ville].filter(Boolean).join(', ')
    if (!address) return NextResponse.json({ error: 'Aucune adresse renseignée' }, { status: 400 })

    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=fr&limit=1`,
      { headers: { 'User-Agent': 'BTPManager/1.0' } }
    )
    const results = await resp.json()

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Adresse introuvable — essayez de placer le marqueur manuellement' }, { status: 422 })
    }

    const latitude = parseFloat(results[0].lat)
    const longitude = parseFloat(results[0].lon)

    await supabase.from('chantiers').update({ latitude, longitude }).eq('id', params.id)

    return NextResponse.json({ success: true, latitude, longitude, source: 'nominatim', display_name: results[0].display_name })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Remove coordinates
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    await supabase.from('chantiers').update({ latitude: null, longitude: null }).eq('id', params.id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
