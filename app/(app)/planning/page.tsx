import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default async function PlanningPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('*, clients(nom)')
    .eq('societe_id', profile?.societe_id || '')
    .not('statut', 'eq', 'annule')
    .order('date_debut_prevue')

  const grouped: Record<string, typeof chantiers> = {}
  chantiers?.forEach(c => {
    const month = c.date_debut_prevue
      ? new Date(c.date_debut_prevue).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : 'Sans date'
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(c)
  })

  const statusColors: Record<string, string> = {
    preparation: 'bg-purple-400', en_cours: 'bg-blue-400', pause: 'bg-yellow-400', termine: 'bg-green-400',
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Planning</h1><p className="text-gray-500 text-sm mt-1">Vue des chantiers par mois</p></div>
      <div className="space-y-4">
        {Object.entries(grouped).map(([month, monthChantiers]) => (
          <div key={month} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-3 border-b border-gray-100"><h2 className="font-semibold text-gray-900 capitalize">{month}</h2></div>
            <div className="divide-y divide-gray-50">
              {monthChantiers?.map(c => (
                <Link key={c.id} href={`/chantiers/${c.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[c.statut] || 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.nom}</p>
                    <p className="text-xs text-gray-500">{(c as any).clients?.nom} — {c.ville}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{formatDate(c.date_debut_prevue)}</p>
                    <p>→ {formatDate(c.date_fin_prevue)}</p>
                  </div>
                  <div className="w-20">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${c.avancement_pct || 0}%` }} />
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-0.5">{c.avancement_pct || 0}%</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {(!chantiers || chantiers.length === 0) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Aucun chantier planifié</p>
            <Link href="/chantiers/nouveau" className="mt-2 inline-block text-sm text-orange-600 hover:underline">Créer un chantier</Link>
          </div>
        )}
      </div>
    </div>
  )
}
