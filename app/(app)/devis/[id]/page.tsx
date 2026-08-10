import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, FileCheck } from 'lucide-react'
import { formatDate, formatCurrency, getStatutDevisColor, getStatutDevisLabel } from '@/lib/utils'

export default async function DevisDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: devis } = await supabase
    .from('devis')
    .select('*, clients(*)')
    .eq('id', params.id)
    .single()

  if (!devis) notFound()

  const { data: lignes } = await supabase
    .from('devis_lignes')
    .select('*')
    .eq('devis_id', params.id)
    .order('position')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/devis" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{devis.objet}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Devis {devis.numero} —{' '}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatutDevisColor(devis.statut)}`}>
                {getStatutDevisLabel(devis.statut)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/devis/${params.id}/modifier`}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Edit className="w-4 h-4" />Modifier
          </Link>
          {devis.statut === 'accepte' && (
            <Link href={`/facturation/nouveau?devis_id=${params.id}`}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <FileCheck className="w-4 h-4" />Créer facture
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Informations</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Numéro</span><span className="font-mono">{devis.numero}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date création</span><span>{formatDate(devis.date_creation)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Validité</span><span>{formatDate(devis.date_validite)}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Client</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{(devis as any).clients?.nom}</p>
              <p className="text-gray-500">{(devis as any).clients?.email}</p>
              <p className="text-gray-500">{(devis as any).clients?.telephone}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Montants</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Montant HT</span><span className="font-medium">{formatCurrency(devis.montant_ht)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">TVA ({devis.taux_tva}%)</span><span className="font-medium">{formatCurrency(devis.montant_tva)}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold"><span>Total TTC</span><span className="text-orange-600">{formatCurrency(devis.montant_ttc)}</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Lignes du devis</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">N°</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Désignation</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Qté</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Unité</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">P.U. HT</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Montant HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lignes && lignes.length > 0 ? lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="px-4 py-3 text-sm text-gray-500">{ligne.position}</td>
                      <td className="px-4 py-3"><p className="text-sm text-gray-700">{ligne.designation}</p></td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{ligne.quantite}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{ligne.unite}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(ligne.prix_unitaire_ht)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(ligne.montant_ht)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">Aucune ligne</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr><td colSpan={5} className="px-4 py-3 text-sm text-right font-semibold text-gray-700">Total HT</td><td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency(devis.montant_ht)}</td></tr>
                  <tr><td colSpan={5} className="px-4 py-3 text-sm text-right font-semibold text-gray-700">TVA {devis.taux_tva}%</td><td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency(devis.montant_tva)}</td></tr>
                  <tr className="border-t-2 border-gray-200"><td colSpan={5} className="px-4 py-3 text-sm text-right font-bold text-gray-900">Total TTC</td><td className="px-4 py-3 text-sm text-right font-bold text-orange-600">{formatCurrency(devis.montant_ttc)}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
