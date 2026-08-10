import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Building2, User, Phone, Mail } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function ClientsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
  const { data: clients } = await supabase.from('clients').select('*').eq('societe_id', profile?.societe_id || '').order('nom')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients?.length || 0} clients enregistrés</p>
        </div>
        <Link href="/clients/nouveau" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nouveau client
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Client', 'Type', 'Contact', 'Ville', 'CA Total', 'Chantiers', 'Depuis'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients && clients.length > 0 ? clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {client.type === 'professionnel' ? <Building2 className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600">{client.nom}</p>
                        {client.siret && <p className="text-xs text-gray-400">SIRET: {client.siret}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${client.type === 'professionnel' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {client.type === 'professionnel' ? 'Professionnel' : 'Particulier'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {client.telephone && <p className="text-xs text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {client.telephone}</p>}
                      {client.email && <p className="text-xs text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.ville || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.ca_total ? formatCurrency(client.ca_total) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.nb_chantiers || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(client.created_at)}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  Aucun client. <Link href="/clients/nouveau" className="text-orange-600 hover:underline">Créer le premier client</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
