import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default async function PlanningPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('*, clients(nom), chantier_lots(*)')
    .eq('societe_id', profile?.societe_id || '')
    .not('statut', 'eq', 'annule')
    .order('date_debut_prevue')

  // Group chantiers by month
  const grouped: Record<string, typeof chantiers> = {}
  chantiers?.forEach(c => {
    const month = c.date_debut_prevue
      ? new Date(c.date_debut_prevue).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : 'Sans date'
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(c)
  })

  const statusColors: Record<string, string> = {
    preparation: 'bg-purple-400',
    en_cours: 'bg-blue-400',
    pause: 'bg-yellow-400',
    termine: 'bg-green-400',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
        <p className="text-gray-500 text-sm mt-1">Vue Gantt des chantiers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-900">Calendrier des chantiers</span>
          <div className="flex items-center gap-4 ml-auto text-xs">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${color}`} />
                <span className="capitalize text-gray-600">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Gantt chart header - months */}
            <GanttView chantiers={chantiers || []} />
          </div>
        </div>
      </div>

      {/* List view by month */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([month, monthChantiers]) => (
          <div key={month} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 capitalize">{month}</h2>
            </div>
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
            <Link href="/chantiers/nouveau" className="mt-2 inline-block text-sm text-orange-600 hover:underline">
              Créer un chantier
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function GanttView({ chantiers }: { chantiers: any[] }) {
  if (!chantiers.length) return null

  const now = new Date()
  const months: Date[] = []
  for (let i = -1; i < 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push(d)
  }

  const getBarStyle = (chantier: any) => {
    if (!chantier.date_debut_prevue || !chantier.date_fin_prevue) return null
    const start = new Date(chantier.date_debut_prevue)
    const end = new Date(chantier.date_fin_prevue)
    const ganttStart = months[0]
    const ganttEnd = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 0)
    const totalDays = (ganttEnd.getTime() - ganttStart.getTime()) / 86400000
    const startOffset = Math.max(0, (start.getTime() - ganttStart.getTime()) / 86400000)
    const duration = Math.min(totalDays - startOffset, (end.getTime() - start.getTime()) / 86400000)
    const left = (startOffset / totalDays) * 100
    const width = Math.max(1, (duration / totalDays) * 100)
    return { left: `${left}%`, width: `${width}%` }
  }

  const statusColors: Record<string, string> = {
    preparation: 'bg-purple-400',
    en_cours: 'bg-blue-400',
    pause: 'bg-yellow-400',
    termine: 'bg-green-400',
    annule: 'bg-gray-400',
  }

  return (
    <div className="p-6">
      {/* Month headers */}
      <div className="flex mb-2 ml-48">
        {months.map((m, i) => (
          <div key={i} className="flex-1 text-xs text-gray-400 text-center border-l border-gray-100 py-1">
            {m.toLocaleDateString('fr-FR', { month: 'short' })}
          </div>
        ))}
      </div>
      {/* Today marker */}
      <div className="relative">
        {chantiers.map((c) => {
          const style = getBarStyle(c)
          return (
            <div key={c.id} className="flex items-center mb-2 group">
              <div className="w-48 flex-shrink-0 pr-3">
                <p className="text-xs font-medium text-gray-700 truncate">{c.nom}</p>
              </div>
              <div className="flex-1 h-6 bg-gray-50 rounded relative">
                {style && (
                  <div
                    className={`absolute top-1 bottom-1 rounded ${statusColors[c.statut] || 'bg-gray-300'} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    style={style}
                    title={`${c.nom}: ${c.avancement_pct || 0}%`}
                  >
                    {parseFloat(style.width) > 5 && (
                      <div
                        className="h-full bg-black/20 rounded-l"
                        style={{ width: `${c.avancement_pct || 0}%` }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
