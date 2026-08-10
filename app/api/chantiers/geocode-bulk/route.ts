import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user.id).single()

    const { data: chantiers } = await supabase
      .from('chantiers')
      .select('id, adresse, code_postal, ville')
      .eq('societe_id', profile?.societe_id || '')
      .is('latitude', null)

    if (!chantiers || chantiers.length === 0) {
      return NextResponse.json({ message: 'Aucun chantier à géocoder', count: 0 })
    }

    let geocoded = 0

    for (const chantier of chantiers) {
      const address = [chantier.adresse, chantier.code_postal, chantier.ville].filter(Boolean).join(', ')
      if (!address) continue

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=fr&limit=1`,
          { headers: { 'User-Agent': 'BTPManager/1.0' } }
        )
        const results = await response.json()
        if (results && results.length > 0) {
          await supabase.from('chantiers').update({
            latitude: parseFloat(results[0].lat),
            longitude: parseFloat(results[0].lon),
          }).eq('id', chantier.id)
          geocoded++
        }
      } catch (e) {
        console.error(`Failed to geocode chantier ${chantier.id}:`, e)
      }
      await new Promise(resolve => setTimeout(resolve, 1100))
    }

    return NextResponse.json({ success: true, geocoded, total: chantiers.length })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
