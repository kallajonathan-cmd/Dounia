'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Ligne {
  position: number
  type: string
  designation: string
  description: string
  unite: string
  quantite: number
  prix_unitaire_ht: number
  taux_tva: number
  montant_ht: number
}

function NouveauDevisForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdParam = searchParams.get('client_id')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    client_id: clientIdParam || '',
    objet: '',
    description: '',
    type_travaux: '',
    adresse_chantier: '',
    code_postal_chantier: '',
    ville_chantier: '',
    taux_tva: 20,
    validite_jours: 30,
    conditions_paiement: '',
    notes: '',
  })
  const [lignes, setLignes] = useState<Ligne[]>([
    { position: 1, type: 'prestation', designation: '', description: '', unite: 'forfait', quantite: 1, prix_unitaire_ht: 0, taux_tva: 20, montant_ht: 0 },
  ])

  useEffect(() => {
    const loadClients = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
      const { data } = await supabase.from('clients').select('id, nom').eq('societe_id', profile?.societe_id || '').order('nom')
      setClients(data || [])
    }
    loadClients()
  }, [])

  const updateLigne = (index: number, field: string, value: any) => {
    const newLignes = [...lignes]
    newLignes[index] = { ...newLignes[index], [field]: value }
    if (field === 'quantite' || field === 'prix_unitaire_ht') {
      newLignes[index].montant_ht = newLignes[index].quantite * newLignes[index].prix_unitaire_ht
    }
    setLignes(newLignes)
  }

  const addLigne = () => {
    setLignes([...lignes, {
      position: lignes.length + 1, type: 'prestation', designation: '', description: '',
      unite: 'forfait', quantite: 1, prix_unitaire_ht: 0, taux_tva: 20, montant_ht: 0,
    }])
  }

  const removeLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index))
  }

  const montantHT = lignes.filter(l => l.type !== 'section').reduce((s, l) => s + l.montant_ht, 0)
  const montantTVA = montantHT * formData.taux_tva / 100
  const montantTTC = montantHT + montantTVA

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()

    const numero = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
    const date_creation = new Date().toISOString().split('T')[0]
    const date_validite = new Date(Date.now() + formData.validite_jours * 86400000).toISOString().split('T')[0]

    const { data: devis, error: insertError } = await supabase.from('devis').insert({
      ...formData,
      societe_id: profile?.societe_id,
      numero,
      statut: 'brouillon',
      date_creation,
      date_validite,
      montant_ht: montantHT,
      montant_tva: montantTVA,
      montant_ttc: montantTTC,
      created_by: user?.id,
    }).select().single()

    if (insertError || !devis) {
      setError(insertError?.message || 'Erreur lors de la création')
      setLoading(false)
      return
    }

    // Insert lignes
    const lignesData = lignes.map((l, i) => ({ ...l, devis_id: devis.id, position: i + 1 }))
    await supabase.from('devis_lignes').insert(lignesData)

    router.push(`/devis/${devis.id}`)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/devis" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau devis</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objet <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.objet}
                onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Rénovation salle de bain..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de travaux</label>
              <input
                type="text"
                value={formData.type_travaux}
                onChange={(e) => setFormData({ ...formData, type_travaux: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Maçonnerie, plomberie..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validité (jours)</label>
              <input
                type="number"
                value={formData.validite_jours}
                onChange={(e) => setFormData({ ...formData, validite_jours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du chantier</label>
              <input
                type="text"
                value={formData.adresse_chantier}
                onChange={(e) => setFormData({ ...formData, adresse_chantier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CP</label>
              <input
                type="text"
                value={formData.code_postal_chantier}
                onChange={(e) => setFormData({ ...formData, code_postal_chantier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={formData.ville_chantier}
                onChange={(e) => setFormData({ ...formData, ville_chantier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Lignes du devis</h2>
            <button type="button" onClick={addLigne} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700">
              <Plus className="w-4 h-4" /> Ajouter une ligne
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs text-gray-500 px-3 py-2">#</th>
                  <th className="text-left text-xs text-gray-500 px-3 py-2">Désignation</th>
                  <th className="text-left text-xs text-gray-500 px-3 py-2 w-20">Unité</th>
                  <th className="text-right text-xs text-gray-500 px-3 py-2 w-20">Qté</th>
                  <th className="text-right text-xs text-gray-500 px-3 py-2 w-28">P.U. HT (€)</th>
                  <th className="text-right text-xs text-gray-500 px-3 py-2 w-28">Montant HT</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={ligne.designation}
                        onChange={(e) => updateLigne(i, 'designation', e.target.value)}
                        placeholder="Désignation..."
                        className="w-full border-0 border-b border-gray-200 py-1 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={ligne.unite}
                        onChange={(e) => updateLigne(i, 'unite', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(i, 'quantite', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={ligne.prix_unitaire_ht}
                        onChange={(e) => updateLigne(i, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{ligne.montant_ht.toFixed(2)} €</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeLigne(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total HT</td>
                  <td className="px-4 py-2 text-right text-sm font-bold">{montantHT.toFixed(2)} €</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                    TVA
                    <input
                      type="number"
                      value={formData.taux_tva}
                      onChange={(e) => setFormData({ ...formData, taux_tva: parseFloat(e.target.value) })}
                      className="ml-2 w-16 border border-gray-300 rounded px-1 py-0.5 text-sm"
                    />
                    %
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-bold">{montantTVA.toFixed(2)} €</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-sm font-bold text-gray-900">Total TTC</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-orange-600">{montantTTC.toFixed(2)} €</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
            <input
              type="text"
              value={formData.conditions_paiement}
              onChange={(e) => setFormData({ ...formData, conditions_paiement: e.target.value })}
              placeholder="30 jours fin de mois..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/devis" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer le devis
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NouveauDevisPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>}>
      <NouveauDevisForm />
    </Suspense>
  )
}
