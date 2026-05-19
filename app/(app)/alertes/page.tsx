import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Settings, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { formatDateTime, getNiveauAlerteColor } from '@/lib/utils'
import MarkAllReadButton from './MarkAllReadButton'

export default async function AlertesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: alertes } = await supabase
    .from('alertes')
    .select('*')
    .eq('societe_id', profile?.societe_id || '')
    .order('created_at', { ascending: false })
    .limit(100)

  const nonLues = alertes?.filter(a => !a.lue).length || 0

  const iconMap: Record<string, React.ReactNode> = {
    error: <AlertTriangle className="w-4 h-4 text-red-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {nonLues > 0 ? `${nonLues} alerte(s) non lue(s)` : 'Toutes les alertes sont lues'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nonLues > 0 && <MarkAllReadButton societeId={profile?.societe_id} />}
          <Link href="/alertes/parametres"
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Settings className="w-4 h-4" /> Paramètres
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {alertes && alertes.length > 0 ? alertes.map((a) => (
          <div key={a.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
            !a.lue ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="mt-0.5 flex-shrink-0">
              {iconMap[a.niveau] || <Bell className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-semibold ${!a.lue ? 'text-gray-900' : 'text-gray-600'}`}>{a.titre}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{a.message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!a.lue && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                  <span className="text-xs text-gray-400">{formatDateTime(a.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getNiveauAlerteColor(a.niveau)}`}>
                  {a.niveau}
                </span>
                <span className="text-xs text-gray-400">{a.type}</span>
                {a.envoyee_whatsapp && <span className="text-xs text-green-600">✓ WhatsApp</span>}
                {a.envoyee_email && <span className="text-xs text-blue-600">✓ Email</span>}
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Aucune alerte</p>
          </div>
        )}
      </div>
    </div>
  )
}
