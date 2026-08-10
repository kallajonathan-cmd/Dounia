import { createClient } from '@/lib/supabase/server'
import MapView from './MapView'

export default async function CartePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: chantiersRaw } = await supabase
    .from('chantiers')
    .select('id, nom, adresse, code_postal, ville, statut, avancement_pct, latitude, longitude, clients(nom)')
    .eq('societe_id', profile?.societe_id || '')
    .not('statut', 'eq', 'annule')

  const chantiers = (chantiersRaw || []).map((c: any) => ({
    ...c,
    clients: Array.isArray(c.clients) ? c.clients[0] : c.clients,
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Carte</h1>
        <p className="text-gray-500 text-sm mt-1">Localisation des chantiers</p>
      </div>
      <MapView chantiers={chantiers} />
    </div>
  )
}
