'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function NouvelleFactureForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const devisId = searchParams.get('devis_id')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [chantiersList, setChantiersList] = useState<any[]>([])
  const [formData, setFormData] = useState({
    client_id: '',
    chantier_id: '',
    devis_id: devisId || '',
    type: 'facture',
    objet: '',
    taux_tva: 20,
    conditions_paiement: '',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: '',
    notes: '',
  })
  const [lignes, setLignes] = useState([
    { position: 1, designation: '', description: '', unite: 'forfait', quantite: 1, prix_unitaire_ht: 0, taux_tva: 20, montant_ht: 0 },
  ])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
      const [{ data: cls }, { data: chts }] = await Promise.all([
        supabase.from('clients').select('id, nom').eq('societe_id', profile?.societe_id || '').order('nom'),
        supabase.from('chantiers').select('id, nom, numero, client_id').eq('societe_id', profile?.societe_id || '').order('nom'),
      ])
      setClients(cls || [])
      setChantiersList(chts || [])

      if (devisId) {
        const { data: devis } = await supabase.from('devis').select('*, devis_lignes(*)').eq('id', devisId).single()
        if (devis) {
          setFormData(f => ({
            ...f,
            client_id: devis.client_id,
            devis_id: devis.id,
            objet: devis.objet,
            taux_tva: devis.taux_tva,
          }))
          if (devis.devis_lignes?.length > 0) {
            setLignes(devis.devis_lignes.map((l: any, i: number) => ({
              position: i + 1,
              designation: l.designation,
              description: l.description || '',
              unite: l.unite || 'forfait',
              quantite: l.quantite,
              prix_unitaire_ht: l.prix_unitaire_ht,
              taux_tva: l.taux_tva,
              montant_ht: l.montant_ht,
            })))
          }
        }
      }
    }
    load()
  }, [devisId])

  const updateLigne = (index: number, field: string, value: any) => {
    const nl = [...lignes]
    nl[index] = { ...nl[index], [field]: value }
    if (field === 'quantite' || field === 'prix_unitaire_ht') {
      nl[index].montant_ht = nl[index].quantite * nl[index].prix_unitaire_ht
    }
    setLignes(nl)
  }

  const montantHT = lignes.reduce((s, l) => s + l.montant_ht, 0)
  const montantTVA = montantHT * formData.taux_tva / 100
  const montantTTC = montantHT + montantTVA

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()

    const numero = `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

    const { data: facture, error: err } = await supabase.from('factures').insert({
      ...formData,
      client_id: formData.client_id || null,
      chantier_id: formData.chantier_id || null,
      devis_id: formData.devis_id || null,
      societe_id: profile?.societe_id,
      numero,
      statut: 'brouillon',
      montant_ht: montantHT,
      montant_tva: montantTVA,
      montant_ttc: montantTTC,
      montant_paye: 0,
      montant_restant: montantTTC,
      created_by: user?.id,
    }).select().single()

    if (err || !facture) {
      setError(err?.message || 'Erreur')
      setLoading(false)
      return
    }

    await supabase.from('facture_lignes').insert(
      lignes.map((l, i) => ({ ...l, facture_id: facture.id, position: i + 1 }))
    )

    router.push(`/facturation/${facture.id}`)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/facturation" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Sélectionner</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="facture">Facture</option>
                <option value="acompte">Acompte</option>
                <option value="situation">Situation</option>
                <option value="avoir">Avoir</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Objet <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.objet} onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
              <select value={formData.chantier_id} onChange={(e) => setFormData({ ...formData, chantier_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Aucun</option>
                {chantiersList.map(c => <option key={c.id} value={c.id}>{c.numero} - {c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;émission</label>
              <input type="date" value={formData.date_emission} onChange={(e) => setFormData({ ...formData, date_emission: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;échéance</label>
              <input type="date" value={formData.date_echeance} onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
              <input type="text" value={formData.conditions_paiement} onChange={(e) => setFormData({ ...formData, conditions_paiement: e.target.value })}
                placeholder="30 jours..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Lignes</h2>
            <button type="button" onClick={() => setLignes([...lignes, { position: lignes.length + 1, designation: '', description: '', unite: 'forfait', quantite: 1, prix_unitaire_ht: 0, taux_tva: 20, montant_ht: 0 }])}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700">
              <Plus className="w-4 h-4" /> Ajouter
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
                {lignes.map((l, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2">
                      <input type="text" value={l.designation} onChange={(e) => updateLigne(i, 'designation', e.target.value)}
                        className="w-full border-0 border-b border-gray-200 py-1 text-sm focus:outline-none focus:border-orange-500" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={l.unite} onChange={(e) => updateLigne(i, 'unite', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={l.quantite} onChange={(e) => updateLigne(i, 'quantite', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.01" value={l.prix_unitaire_ht} onChange={(e) => updateLigne(i, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right" />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{l.montant_ht.toFixed(2)} €</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => setLignes(lignes.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium">Total HT</td>
                  <td className="px-4 py-2 text-right text-sm font-bold">{montantHT.toFixed(2)} €</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium">TVA {formData.taux_tva}%</td>
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

        <div className="flex items-center justify-end gap-3">
          <Link href="/facturation" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer la facture
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NouvelleFacturePage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>}>
      <NouvelleFactureForm />
    </Suspense>
  )
}
