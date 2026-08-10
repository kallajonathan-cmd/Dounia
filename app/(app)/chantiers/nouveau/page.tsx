'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NouveauChantierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [devisList, setDevisList] = useState<any[]>([])
  const [formData, setFormData] = useState({
    client_id: '',
    devis_id: '',
    nom: '',
    description: '',
    type_travaux: '',
    statut: 'preparation',
    adresse: '',
    code_postal: '',
    ville: '',
    date_debut_prevue: '',
    date_fin_prevue: '',
    budget_ht: '',
    marge_prevue_pct: '',
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
      const [{ data: cls }, { data: dvs }] = await Promise.all([
        supabase.from('clients').select('id, nom').eq('societe_id', profile?.societe_id || '').order('nom'),
        supabase.from('devis').select('id, numero, objet, client_id').eq('societe_id', profile?.societe_id || '').eq('statut', 'accepte').order('created_at', { ascending: false }),
      ])
      setClients(cls || [])
      setDevisList(dvs || [])
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()

    const numero = `CH-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

    const { data: chantier, error: insertError } = await supabase.from('chantiers').insert({
      ...formData,
      client_id: formData.client_id || null,
      devis_id: formData.devis_id || null,
      budget_ht: formData.budget_ht ? parseFloat(formData.budget_ht) : null,
      marge_prevue_pct: formData.marge_prevue_pct ? parseFloat(formData.marge_prevue_pct) : null,
      date_debut_prevue: formData.date_debut_prevue || null,
      date_fin_prevue: formData.date_fin_prevue || null,
      societe_id: profile?.societe_id,
      numero,
      avancement_pct: 0,
      created_by: user?.id,
    }).select().single()

    if (insertError || !chantier) {
      setError(insertError?.message || 'Erreur')
      setLoading(false)
      return
    }

    router.push(`/chantiers/${chantier.id}`)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/chantiers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau chantier</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du chantier <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Rénovation maison Dupont..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Aucun client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devis associé</label>
            <select value={formData.devis_id} onChange={(e) => setFormData({ ...formData, devis_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Aucun devis</option>
              {devisList.map(d => <option key={d.id} value={d.id}>{d.numero} - {d.objet}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="preparation">Préparation</option>
              <option value="en_cours">En cours</option>
              <option value="pause">En pause</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de travaux</label>
            <input type="text" value={formData.type_travaux} onChange={(e) => setFormData({ ...formData, type_travaux: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
            <input type="text" value={formData.code_postal} onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input type="text" value={formData.ville} onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début prévue</label>
            <input type="date" value={formData.date_debut_prevue} onChange={(e) => setFormData({ ...formData, date_debut_prevue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin prévue</label>
            <input type="date" value={formData.date_fin_prevue} onChange={(e) => setFormData({ ...formData, date_fin_prevue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget HT (€)</label>
            <input type="number" step="0.01" value={formData.budget_ht} onChange={(e) => setFormData({ ...formData, budget_ht: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marge prévue (%)</label>
            <input type="number" step="0.1" value={formData.marge_prevue_pct} onChange={(e) => setFormData({ ...formData, marge_prevue_pct: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/chantiers" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer le chantier
          </button>
        </div>
      </form>
    </div>
  )
}
