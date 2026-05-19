import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function MateriauxPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: commandes } = await supabase
    .from('commandes_materiaux')
    .select('*, fournisseurs(nom), chantiers(nom, numero)')
    .eq('societe_id', profile?.societe_id || '')
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    brouillon: 'bg-gray-100 text-gray-600',
    envoyee: 'bg-blue-100 text-blue-700',
    confirmee: 'bg-purple-100 text-purple-700',
    livree_partiel: 'bg-yellow-100 text-yellow-700',
    livree: 'bg-green-100 text-green-700',
    annulee: 'bg-red-100 text-red-600',
  }

  const statusLabels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoyee: 'Envoyée',
    confirmee: 'Confirmée',
    livree_partiel: 'Liv. partielle',
    livree: 'Livrée',
    annulee: 'Annulée',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matériaux & Commandes</h1>
          <p className="text-gray-500 text-sm mt-1">{commandes?.length || 0} commandes</p>
        </div>
        <Link
          href="/materiaux/nouvelle-commande"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouvelle commande
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Numéro</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Objet</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Fournisseur</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Chantier</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date commande</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Livraison</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Montant TTC</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {commandes && commandes.length > 0 ? commandes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{c.numero}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.objet || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(c as any).fournisseurs?.nom || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(c as any).chantiers?.nom || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(c.date_commande)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.date_livraison_reelle ? (
                      <span className="text-green-600">{formatDate(c.date_livraison_reelle)}</span>
                    ) : formatDate(c.date_livraison_souhaitee)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">
                    {c.montant_ttc ? formatCurrency(c.montant_ttc) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[c.statut] || 'bg-gray-100'}`}>
                      {statusLabels[c.statut] || c.statut}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    Aucune commande. <Link href="/materiaux/nouvelle-commande" className="text-orange-600 hover:underline">Créer la première</Link>
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
