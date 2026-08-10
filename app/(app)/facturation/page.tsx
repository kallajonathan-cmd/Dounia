import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate, formatCurrency, getStatutFactureColor, getStatutFactureLabel } from '@/lib/utils'

export default async function FacturationPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: factures } = await supabase
    .from('factures')
    .select('*, clients(nom)')
    .eq('societe_id', profile?.societe_id || '')
    .order('created_at', { ascending: false })

  const totalTTC = factures?.reduce((s, f) => s + (f.montant_ttc || 0), 0) || 0
  const totalPaye = factures?.reduce((s, f) => s + (f.montant_paye || 0), 0) || 0
  const totalRestant = factures?.reduce((s, f) => s + (f.montant_restant || 0), 0) || 0
  const enRetard = factures?.filter(f => f.statut === 'en_retard').length || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
          <p className="text-gray-500 text-sm mt-1">{factures?.length || 0} factures</p>
        </div>
        <Link href="/facturation/nouveau"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle facture
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total facturé TTC" value={formatCurrency(totalTTC)} color="bg-blue-50 text-blue-700" />
        <StatCard label="Total encaissé" value={formatCurrency(totalPaye)} color="bg-green-50 text-green-700" />
        <StatCard label="Reste à encaisser" value={formatCurrency(totalRestant)} color="bg-orange-50 text-orange-700" />
        <StatCard label="En retard" value={enRetard.toString()} color="bg-red-50 text-red-700" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Numéro</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Objet</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Émission</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Échéance</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">TTC</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Restant</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {factures && factures.length > 0 ? factures.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{f.numero}</td>
                  <td className="px-4 py-3">
                    <Link href={`/facturation/${f.id}`} className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-1">{f.objet}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(f as any).clients?.nom || '-'}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{f.type}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(f.date_emission)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(f.date_echeance)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(f.montant_ttc)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-orange-600">{formatCurrency(f.montant_restant)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatutFactureColor(f.statut)}`}>
                      {getStatutFactureLabel(f.statut)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">Aucune facture.</td></tr>
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
    <div className={`rounded-xl border border-gray-100 shadow-sm p-4 ${color}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}
