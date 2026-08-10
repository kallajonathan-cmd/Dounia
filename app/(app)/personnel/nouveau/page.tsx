'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NouveauPersonnelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', telephone: '', poste: '', statut: 'actif',
    date_naissance: '', nationalite: '', type_titre_sejour: '',
    numero_titre_sejour: '', date_validite_titre: '', salaire_brut: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
    const { error: err } = await supabase.from('personnel').insert({
      ...formData, societe_id: profile?.societe_id,
      salaire_brut: formData.salaire_brut ? parseFloat(formData.salaire_brut) : null,
      date_naissance: formData.date_naissance || null,
      date_validite_titre: formData.date_validite_titre || null,
    })
    if (err) { setError(err.message); setLoading(false) } else { router.push('/personnel'); router.refresh() }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/personnel" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvel employé</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Prénom <span className="text-red-500">*</span></label><input type="text" required value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label><input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Poste</label><input type="text" value={formData.poste} onChange={(e) => setFormData({ ...formData, poste: e.target.value })} placeholder="Maçon, Chef de chantier..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Statut</label><select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="actif">Actif</option><option value="inactif">Inactif</option><option value="conge">En congé</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nationalité</label><input type="text" value={formData.nationalite} onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Salaire brut (€/mois)</label><input type="number" step="0.01" value={formData.salaire_brut} onChange={(e) => setFormData({ ...formData, salaire_brut: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <div className="md:col-span-2 pt-2 border-t border-gray-100"><h3 className="text-sm font-semibold text-gray-700 mb-3">Titre de séjour (si applicable)</h3></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type de titre</label><input type="text" value={formData.type_titre_sejour} onChange={(e) => setFormData({ ...formData, type_titre_sejour: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Date de validité</label><input type="date" value={formData.date_validite_titre} onChange={(e) => setFormData({ ...formData, date_validite_titre: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/personnel" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</Link>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
