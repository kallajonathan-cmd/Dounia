'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NouveauClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ type: 'professionnel', nom: '', siret: '', adresse: '', code_postal: '', ville: '', email: '', telephone: '', contact_nom: '', contact_prenom: '', notes: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
    const { error: insertError } = await supabase.from('clients').insert({ ...formData, societe_id: profile?.societe_id })
    if (insertError) { setError(insertError.message); setLoading(false) }
    else { router.push('/clients'); router.refresh() }
  }

  const inp = (label: string, key: string, type = 'text', extra?: any) => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(formData as any)[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" {...extra} />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clients" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau client</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Type de client</label>
          <div className="flex gap-3">
            {['professionnel', 'particulier'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value={type} checked={formData.type === type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="text-orange-500" />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom / Raison sociale <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          {formData.type === 'professionnel' && inp('SIRET', 'siret')}
          {inp('Téléphone', 'telephone', 'tel')}
          {inp('Email', 'email', 'email')}
          <div className="md:col-span-2">{inp('Adresse', 'adresse')}</div>
          {inp('Code postal', 'code_postal')}
          {inp('Ville', 'ville')}
          {formData.type === 'professionnel' && <>{inp('Prénom contact', 'contact_prenom')}{inp('Nom contact', 'contact_nom')}</>}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/clients" className="px-4 py-2 text-sm text-gray-600">Annuler</Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Créer le client
          </button>
        </div>
      </form>
    </div>
  )
}
