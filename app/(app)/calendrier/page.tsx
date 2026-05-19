'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [currentDate])

  const loadEvents = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]

    const [{ data: chantiers }, { data: devis }, { data: factures }] = await Promise.all([
      supabase.from('chantiers').select('id, nom, date_debut_prevue, date_fin_prevue, statut')
        .eq('societe_id', profile?.societe_id || '')
        .or(`date_debut_prevue.gte.${startOfMonth},date_fin_prevue.lte.${endOfMonth}`),
      supabase.from('devis').select('id, objet, date_validite, statut')
        .eq('societe_id', profile?.societe_id || '')
        .gte('date_validite', startOfMonth).lte('date_validite', endOfMonth),
      supabase.from('factures').select('id, objet, date_echeance, statut')
        .eq('societe_id', profile?.societe_id || '')
        .gte('date_echeance', startOfMonth).lte('date_echeance', endOfMonth),
    ])

    const allEvents = [
      ...(chantiers || []).map(c => ({ ...c, type: 'chantier', date: c.date_debut_prevue, label: c.nom, color: 'blue' })),
      ...(devis || []).map(d => ({ ...d, type: 'devis', date: d.date_validite, label: d.objet, color: 'purple' })),
      ...(factures || []).map(f => ({ ...f, type: 'facture', date: f.date_echeance, label: f.objet, color: 'red' })),
    ]

    setEvents(allEvents)
    setLoading(false)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const days = []
  const offset = firstDay === 0 ? 6 : firstDay - 1
  for (let i = 0; i < offset; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const getEventsForDay = (day: number | null) => {
    if (!day) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
        <p className="text-gray-500 text-sm mt-1">Vue mensuelle des échéances et chantiers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 capitalize">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day)
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

            return (
              <div
                key={i}
                className={`min-h-[100px] p-2 border-r border-b border-gray-50 ${!day ? 'bg-gray-50/50' : ''}`}
              >
                {day && (
                  <>
                    <div className={`w-6 h-6 flex items-center justify-center text-sm rounded-full mb-1 ${
                      isToday ? 'bg-orange-500 text-white font-bold' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <Link
                          key={j}
                          href={`/${e.type === 'chantier' ? 'chantiers' : e.type === 'devis' ? 'devis' : 'facturation'}/${e.id}`}
                          className={`block text-xs px-1 py-0.5 rounded truncate ${colorClasses[e.color] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {e.label}
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} autres</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-400" /><span className="text-gray-600">Chantiers</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-400" /><span className="text-gray-600">Devis (validité)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-gray-600">Factures (échéance)</span></div>
      </div>
    </div>
  )
}
