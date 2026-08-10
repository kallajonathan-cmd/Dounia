import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'
import { formatDate, formatCurrency, getStatutChantierColor, getStatutChantierLabel } from '@/lib/utils'

export default async function ChantiersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('*, clients(nom)')
    .eq('societe_id', profile?.societe_id || '')
    .order('created_at', { ascending: false })

  const statuts = ['en_cours', 'preparation', 'pause', 'termine', 'annule']
  const stats = statuts.reduce((acc, s) => {
    acc[s] = chantiers?.filter(c => c.statut === s).length || 0
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chantiers</h1>
          <p className="text-gray-500 text-sm mt-1">{chantiers?.length || 0} chantiers au total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/carte" className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <MapPin className="w-4 h-4" /> Carte
          </Link>
          <Link href="/chantiers/nouveau" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouveau chantier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'en_cours', label: 'En cours' },
          { key: 'preparation', label: 'Préparation' },
          { key: 'pause', label: 'En pause' },
          { key: 'termine', label: 'Terminés' },
          { key: 'annule', label: 'Annulés' },
        ].map(({ key, label }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats[key]}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatutChantierColor(key)}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Chantier</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Localisation</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Avancement</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Budget HT</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Dates</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {chantiers && chantiers.length > 0 ? chantiers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/chantiers/${c.id}`} className="group">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600">{c.nom}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.numero}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(c as any).clients?.nom || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {c.ville || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${c.avancement_pct || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{c.avancement_pct || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {c.budget_ht ? formatCurrency(c.budget_ht) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(c.date_debut_prevue)} → {formatDate(c.date_fin_prevue)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatutChantierColor(c.statut)}`}>
                      {getStatutChantierLabel(c.statut)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    Aucun chantier. <Link href="/chantiers/nouveau" className="text-orange-600 hover:underline">Créer le premier</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
