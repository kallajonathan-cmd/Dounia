'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TYPES_ASSURANCE = [
  'Responsabilité Civile',
  'Décennale',
  'Dommages Ouvrage',
  'Multirisque',
  'Flotte Auto',
  'Matériel',
  'Autre',
]

export default function NouvelleAssurancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    type: '',
    compagnie: '',
    numero_contrat: '',
    objet: '',
    montant_prime_annuelle: '',
    date_debut: '',
    date_echeance: '',
    date_renouvellement: '',
    tacite_reconduction: false,
    alerte_60j: true,
    alerte_30j: true,
    alerte_15j: true,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()

    const { error: err } = await supabase.from('assurances').insert({
      ...formData,
      societe_id: profile?.societe_id,
      montant_prime_annuelle: formData.montant_prime_annuelle ? parseFloat(formData.montant_prime_annuelle) : null,
      date_debut: formData.date_debut || null,
      date_echeance: formData.date_echeance || null,
      date_renouvellement: formData.date_renouvellement || null,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/assurances')
      router.refresh()
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/assurances" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle assurance</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
            <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Sélectionner</option>
              {TYPES_ASSURANCE.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compagnie <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.compagnie} onChange={(e) => setFormData({ ...formData, compagnie: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de contrat</label>
            <input type="text" value={formData.numero_contrat} onChange={(e) => setFormData({ ...formData, numero_contrat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prime annuelle (€)</label>
            <input type="number" step="0.01" value={formData.montant_prime_annuelle} onChange={(e) => setFormData({ ...formData, montant_prime_annuelle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
            <input type="text" value={formData.objet} onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input type="date" value={formData.date_debut} onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;échéance</label>
            <input type="date" value={formData.date_echeance} onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de renouvellement</label>
            <input type="date" value={formData.date_renouvellement} onChange={(e) => setFormData({ ...formData, date_renouvellement: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="tacite" checked={formData.tacite_reconduction}
              onChange={(e) => setFormData({ ...formData, tacite_reconduction: e.target.checked })}
              className="rounded text-orange-500" />
            <label htmlFor="tacite" className="text-sm text-gray-700">Tacite reconduction</label>
          </div>

          <div className="md:col-span-2 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Alertes de renouvellement</h3>
            <div className="flex gap-6">
              {[{ key: 'alerte_60j', label: '60 jours avant' }, { key: 'alerte_30j', label: '30 jours avant' }, { key: 'alerte_15j', label: '15 jours avant' }].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(formData as any)[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="rounded text-orange-500" />
                  <span className="text-sm text-gray-600">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/assurances" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</Link>
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
