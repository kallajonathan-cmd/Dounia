import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, CheckCircle, XCircle, Phone, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function SousTraitantsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: sousTraitants } = await supabase
    .from('sous_traitants')
    .select('*')
    .eq('societe_id', profile?.societe_id || '')
    .order('nom')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sous-traitants</h1>
          <p className="text-gray-500 text-sm mt-1">{sousTraitants?.length || 0} sous-traitants</p>
        </div>
        <Link
          href="/sous-traitants/nouveau"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouveau sous-traitant
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sousTraitants && sousTraitants.length > 0 ? sousTraitants.map((st) => (
          <div key={st.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{st.nom}</h3>
                {st.contact_nom && <p className="text-sm text-gray-500">{st.contact_nom}</p>}
              </div>
              {st.conforme !== null && st.conforme !== undefined && (
                <div>
                  {st.conforme ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-sm">
              {st.telephone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {st.telephone}
                </div>
              )}
              {st.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {st.email}
                </div>
              )}
              {st.ville && <p className="text-gray-500">{st.code_postal} {st.ville}</p>}
              {st.specialites && st.specialites.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {st.specialites.map((s: string, i: number) => (
                    <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Décennale</p>
                <p className={`font-medium ${
                  !st.assurance_decennale_date_validite ? 'text-gray-400' :
                  new Date(st.assurance_decennale_date_validite) < new Date() ? 'text-red-600' : 'text-green-600'
                }`}>
                  {st.assurance_decennale_date_validite
                    ? new Date(st.assurance_decennale_date_validite) < new Date()
                      ? 'Expirée'
                      : formatDate(st.assurance_decennale_date_validite)
                    : 'Non renseignée'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">KBIS</p>
                <p className={`font-medium ${
                  !st.kbis_date_validite ? 'text-gray-400' :
                  new Date(st.kbis_date_validite) < new Date() ? 'text-red-600' : 'text-green-600'
                }`}>
                  {st.kbis_date_validite
                    ? new Date(st.kbis_date_validite) < new Date() ? 'Expiré' : formatDate(st.kbis_date_validite)
                    : 'Non renseigné'}
                </p>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-gray-400">Aucun sous-traitant.</p>
            <Link href="/sous-traitants/nouveau" className="mt-2 inline-block text-sm text-orange-600 hover:underline">
              Ajouter le premier
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
