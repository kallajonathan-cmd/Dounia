import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { formatDate, formatCurrency, getStatutDevisColor, getStatutDevisLabel } from '@/lib/utils'

export default async function DevisPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: devis } = await supabase
    .from('devis')
    .select('*, clients(nom)')
    .eq('societe_id', profile?.societe_id || '')
    .order('created_at', { ascending: false })

  const stats = {
    total: devis?.length || 0,
    brouillon: devis?.filter(d => d.statut === 'brouillon').length || 0,
    envoye: devis?.filter(d => d.statut === 'envoye').length || 0,
    accepte: devis?.filter(d => d.statut === 'accepte').length || 0,
    montantTotal: devis?.reduce((s, d) => s + (d.montant_ttc || 0), 0) || 0,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devis</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.total} devis au total</p>
        </div>
        <Link
          href="/devis/nouveau"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau devis
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total.toString()} color="bg-gray-100 text-gray-700" />
        <StatCard label="Envoyés" value={stats.envoye.toString()} color="bg-blue-100 text-blue-700" />
        <StatCard label="Acceptés" value={stats.accepte.toString()} color="bg-green-100 text-green-700" />
        <StatCard label="Montant total TTC" value={formatCurrency(stats.montantTotal)} color="bg-orange-100 text-orange-700" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Numéro</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Objet</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Validité</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Montant TTC</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {devis && devis.length > 0 ? devis.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{d.numero}</td>
                  <td className="px-4 py-3">
                    <Link href={`/devis/${d.id}`} className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors line-clamp-1">
                      {d.objet}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(d as any).clients?.nom || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(d.date_creation)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(d.date_validite)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(d.montant_ttc)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatutDevisColor(d.statut)}`}>
                      {getStatutDevisLabel(d.statut)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/devis/${d.id}`} className="text-xs text-blue-600 hover:underline">Voir</Link>
                      <Link href={`/devis/${d.id}/modifier`} className="text-xs text-orange-600 hover:underline">Modifier</Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    Aucun devis. <Link href="/devis/nouveau" className="text-orange-600 hover:underline">Créer le premier devis</Link>
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

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-lg font-bold mt-1 px-2 py-0.5 rounded-lg inline-block ${color}`}>{value}</p>
    </div>
  )
}
