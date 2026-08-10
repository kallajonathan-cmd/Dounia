'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ModifierChantierPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
      const [{ data: chantier }, { data: cls }] = await Promise.all([
        supabase.from('chantiers').select('*').eq('id', params.id).single(),
        supabase.from('clients').select('id, nom').eq('societe_id', profile?.societe_id || '').order('nom'),
      ])
      setFormData(chantier)
      setClients(cls || [])
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('chantiers').update({
      nom: formData.nom,
      client_id: formData.client_id || null,
      statut: formData.statut,
      type_travaux: formData.type_travaux,
      adresse: formData.adresse,
      code_postal: formData.code_postal,
      ville: formData.ville,
      date_debut_prevue: formData.date_debut_prevue || null,
      date_fin_prevue: formData.date_fin_prevue || null,
      date_debut_reelle: formData.date_debut_reelle || null,
      date_fin_reelle: formData.date_fin_reelle || null,
      budget_ht: formData.budget_ht ? parseFloat(formData.budget_ht) : null,
      cout_reel_ht: formData.cout_reel_ht ? parseFloat(formData.cout_reel_ht) : null,
      avancement_pct: parseInt(formData.avancement_pct) || 0,
      marge_prevue_pct: formData.marge_prevue_pct ? parseFloat(formData.marge_prevue_pct) : null,
      notes: formData.notes,
    }).eq('id', params.id)
    if (err) { setError(err.message); setSaving(false) }
    else { router.push(`/chantiers/${params.id}`); router.refresh() }
  }

  if (loading || !formData) return (
    <div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
  )

  const field = (label: string, key: string, type = 'text', extra?: any) => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={formData[key] || ''} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" {...extra} />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/chantiers/${params.id}`} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Modifier le chantier</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">{field('Nom', 'nom')}</div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={formData.client_id || ''} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Aucun</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={formData.statut || ''} onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="preparation">Préparation</option><option value="en_cours">En cours</option>
              <option value="pause">En pause</option><option value="termine">Terminé</option><option value="annule">Annulé</option>
            </select>
          </div>
          {field('Avancement (%)', 'avancement_pct', 'number', { min: 0, max: 100 })}
          {field('Type de travaux', 'type_travaux')}
          <div className="md:col-span-2">{field('Adresse', 'adresse')}</div>
          {field('Code postal', 'code_postal')}
          {field('Ville', 'ville')}
          {field('Début prévu', 'date_debut_prevue', 'date')}
          {field('Fin prévue', 'date_fin_prevue', 'date')}
          {field('Début réel', 'date_debut_reelle', 'date')}
          {field('Fin réelle', 'date_fin_reelle', 'date')}
          {field('Budget HT (€)', 'budget_ht', 'number', { step: '0.01' })}
          {field('Coût réel HT (€)', 'cout_reel_ht', 'number', { step: '0.01' })}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href={`/chantiers/${params.id}`} className="px-4 py-2 text-sm text-gray-600">Annuler</Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
