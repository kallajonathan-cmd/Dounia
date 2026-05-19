import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function PersonnelPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('societe_id')
    .eq('id', user?.id || '')
    .single()

  const { data: personnel } = await supabase
    .from('personnel')
    .select('*')
    .eq('societe_id', profile?.societe_id || '')
    .order('nom')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel</h1>
          <p className="text-gray-500 text-sm mt-1">{personnel?.length || 0} employés</p>
        </div>
        <Link
          href="/personnel/nouveau"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouveau employé
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Employé</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Poste</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Titre séjour</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Depuis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {personnel && personnel.length > 0 ? personnel.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.poste || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.statut === 'actif' ? 'bg-green-100 text-green-700' :
                      p.statut === 'conge' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {p.statut === 'actif' ? 'Actif' : p.statut === 'conge' ? 'En congé' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.telephone || '-'}</td>
                  <td className="px-4 py-3">
                    {p.date_validite_titre ? (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        new Date(p.date_validite_titre) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {new Date(p.date_validite_titre) < new Date() ? 'Expiré' : formatDate(p.date_validite_titre)}
                      </span>
                    ) : p.nationalite === 'française' || p.nationalite === 'FR' ? (
                      <span className="text-xs text-gray-400">N/A</span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.created_at)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    Aucun employé. <Link href="/personnel/nouveau" className="text-orange-600 hover:underline">Ajouter le premier</Link>
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
