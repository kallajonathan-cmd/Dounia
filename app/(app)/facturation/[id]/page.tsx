import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { formatDate, formatCurrency, getStatutFactureColor, getStatutFactureLabel } from '@/lib/utils'

export default async function FactureDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: facture } = await supabase
    .from('factures')
    .select('*, clients(*), chantiers(nom, numero)')
    .eq('id', params.id)
    .single()

  if (!facture) notFound()

  const [{ data: lignes }, { data: paiements }] = await Promise.all([
    supabase.from('facture_lignes').select('*').eq('facture_id', params.id).order('position'),
    supabase.from('paiements').select('*').eq('facture_id', params.id).order('date_paiement', { ascending: false }),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facturation" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{facture.objet}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm font-mono">{facture.numero}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatutFactureColor(facture.statut)}`}>
                {getStatutFactureLabel(facture.statut)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Informations</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="capitalize">{facture.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Émission</span>
                <span>{formatDate(facture.date_emission)}</span>
              </div>
              {facture.date_echeance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Échéance</span>
                  <span>{formatDate(facture.date_echeance)}</span>
                </div>
              )}
              {facture.date_paiement && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paiement</span>
                  <span className="text-green-600">{formatDate(facture.date_paiement)}</span>
                </div>
              )}
              {facture.conditions_paiement && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Conditions</span>
                  <span>{facture.conditions_paiement}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Client</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{(facture as any).clients?.nom}</p>
              <p className="text-gray-500">{(facture as any).clients?.email}</p>
              <p className="text-gray-500">{(facture as any).clients?.telephone}</p>
            </div>
          </div>

          {(facture as any).chantiers && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Chantier</h3>
              <Link href={`/chantiers/${facture.chantier_id}`} className="text-sm font-medium text-blue-600 hover:underline">
                {(facture as any).chantiers.nom}
              </Link>
              <p className="text-xs text-gray-500">{(facture as any).chantiers.numero}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Montants</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Montant HT</span>
                <span className="font-medium">{formatCurrency(facture.montant_ht)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">TVA ({facture.taux_tva}%)</span>
                <span className="font-medium">{formatCurrency(facture.montant_tva)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold">
                <span>Total TTC</span>
                <span>{formatCurrency(facture.montant_ttc)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Payé</span>
                <span>{formatCurrency(facture.montant_paye)}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-bold">
                <span>Restant</span>
                <span>{formatCurrency(facture.montant_restant)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Lignes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs text-gray-500 px-4 py-3">#</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-3">Désignation</th>
                    <th className="text-right text-xs text-gray-500 px-4 py-3">Qté</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-3">Unité</th>
                    <th className="text-right text-xs text-gray-500 px-4 py-3">P.U. HT</th>
                    <th className="text-right text-xs text-gray-500 px-4 py-3">Montant HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lignes && lignes.length > 0 ? lignes.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 text-sm text-gray-400">{l.position}</td>
                      <td className="px-4 py-3 text-sm">{l.designation}</td>
                      <td className="px-4 py-3 text-sm text-right">{l.quantite}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{l.unite}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(l.prix_unitaire_ht)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(l.montant_ht)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">Aucune ligne</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Paiements ({paiements?.length || 0})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {paiements && paiements.length > 0 ? paiements.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(p.date_paiement)}</p>
                    <p className="text-xs text-gray-500">{p.mode} {p.reference ? `— ${p.reference}` : ''}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(p.montant)}</p>
                </div>
              )) : (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucun paiement enregistré</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
