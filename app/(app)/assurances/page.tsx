import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Shield, AlertTriangle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function AssurancesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: assurances } = await supabase
    .from('assurances')
    .select('*')
    .eq('societe_id', profile?.societe_id || '')
    .order('date_echeance')

  const today = new Date()
  const in30Days = new Date(today.getTime() + 30 * 86400000)
  const in60Days = new Date(today.getTime() + 60 * 86400000)

  const expiringSoon = assurances?.filter(a => {
    if (!a.date_echeance) return false
    const expiry = new Date(a.date_echeance)
    return expiry <= in60Days
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assurances</h1>
          <p className="text-gray-500 text-sm mt-1">{assurances?.length || 0} contrats d&apos;assurance</p>
        </div>
        <Link
          href="/assurances/nouveau"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouvelle assurance
        </Link>
      </div>

      {expiringSoon && expiringSoon.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Assurances à renouveler bientôt</p>
              <div className="mt-1 space-y-1">
                {expiringSoon.map(a => (
                  <p key={a.id} className="text-sm text-yellow-700">
                    <strong>{a.compagnie}</strong> — {a.type} — Expire le {formatDate(a.date_echeance)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {assurances && assurances.length > 0 ? assurances.map((a) => {
          const expiry = a.date_echeance ? new Date(a.date_echeance) : null
          const isExpired = expiry && expiry < today
          const isExpiringSoon = expiry && !isExpired && expiry <= in60Days

          return (
            <div key={a.id} className={`bg-white rounded-xl border shadow-sm p-5 ${
              isExpired ? 'border-red-200' : isExpiringSoon ? 'border-yellow-200' : 'border-gray-100'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-100' : isExpiringSoon ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  <Shield className={`w-5 h-5 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{a.type}</h3>
                  <p className="text-sm text-gray-500">{a.compagnie}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {a.numero_contrat && (
                  <p className="text-gray-500">N° {a.numero_contrat}</p>
                )}
                {a.objet && (
                  <p className="text-gray-600 line-clamp-2">{a.objet}</p>
                )}
                {a.montant_prime_annuelle && (
                  <p className="font-medium text-gray-900">{formatCurrency(a.montant_prime_annuelle)}/an</p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Début</p>
                  <p className="font-medium text-gray-700">{formatDate(a.date_debut)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Échéance</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-700'}`}>
                    {formatDate(a.date_echeance)}
                    {isExpired && ' ⚠ Expirée'}
                    {isExpiringSoon && ' ⚡ Bientôt'}
                  </p>
                </div>
              </div>

              {a.nb_sinistres > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {a.nb_sinistres} sinistre(s) déclaré(s)
                </div>
              )}
            </div>
          )
        }) : (
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Aucune assurance enregistrée.</p>
            <Link href="/assurances/nouveau" className="mt-2 inline-block text-sm text-orange-600 hover:underline">
              Ajouter la première
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
