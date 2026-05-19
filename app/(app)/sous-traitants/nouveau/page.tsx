'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NouveauSousTraitantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [specialite, setSpecialite] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    siret: '',
    adresse: '',
    code_postal: '',
    ville: '',
    email: '',
    telephone: '',
    contact_nom: '',
    specialites: [] as string[],
    kbis_date_validite: '',
    assurance_decennale_date_validite: '',
    assurance_rc_date_validite: '',
    notes: '',
  })

  const addSpecialite = () => {
    if (specialite.trim() && !formData.specialites.includes(specialite.trim())) {
      setFormData({ ...formData, specialites: [...formData.specialites, specialite.trim()] })
      setSpecialite('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()

    const { error: err } = await supabase.from('sous_traitants').insert({
      ...formData,
      societe_id: profile?.societe_id,
      kbis_date_validite: formData.kbis_date_validite || null,
      assurance_decennale_date_validite: formData.assurance_decennale_date_validite || null,
      assurance_rc_date_validite: formData.assurance_rc_date_validite || null,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/sous-traitants')
      router.refresh()
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/sous-traitants" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau sous-traitant</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
            <input type="text" value={formData.siret} onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <input type="text" value={formData.contact_nom} onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

          {/* Spécialités */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Spécialités</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={specialite} onChange={(e) => setSpecialite(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialite())}
                placeholder="Maçonnerie, plomberie..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <button type="button" onClick={addSpecialite}
                className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formData.specialites.map((s, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                  {s}
                  <button type="button" onClick={() => setFormData({ ...formData, specialites: formData.specialites.filter((_, j) => j !== i) })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validité KBIS</label>
            <input type="date" value={formData.kbis_date_validite} onChange={(e) => setFormData({ ...formData, kbis_date_validite: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validité assurance décennale</label>
            <input type="date" value={formData.assurance_decennale_date_validite} onChange={(e) => setFormData({ ...formData, assurance_decennale_date_validite: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validité assurance RC</label>
            <input type="date" value={formData.assurance_rc_date_validite} onChange={(e) => setFormData({ ...formData, assurance_rc_date_validite: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/sous-traitants" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
