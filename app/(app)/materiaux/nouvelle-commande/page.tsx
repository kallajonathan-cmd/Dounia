'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NouvelleCommandePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [chantiers, setChantiers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    fournisseur_id: '', chantier_id: '', objet: '', statut: 'brouillon',
    date_commande: new Date().toISOString().split('T')[0],
    date_livraison_souhaitee: '', adresse_livraison: '', notes: '',
  })
  const [lignes, setLignes] = useState([
    { position: 1, reference_produit: '', designation: '', unite: 'u', quantite_commandee: 1, prix_unitaire_ht: 0, remise_pct: 0, montant_ht: 0 },
  ])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
      const [{ data: fs }, { data: chts }] = await Promise.all([
        supabase.from('fournisseurs').select('id, nom').eq('societe_id', profile?.societe_id || '').order('nom'),
        supabase.from('chantiers').select('id, nom, numero').eq('societe_id', profile?.societe_id || '').order('nom'),
      ])
      setFournisseurs(fs || [])
      setChantiers(chts || [])
    }
    load()
  }, [])

  const updateLigne = (i: number, field: string, value: any) => {
    const nl = [...lignes]
    nl[i] = { ...nl[i], [field]: value }
    if (['quantite_commandee', 'prix_unitaire_ht', 'remise_pct'].includes(field)) {
      nl[i].montant_ht = nl[i].quantite_commandee * nl[i].prix_unitaire_ht * (1 - (nl[i].remise_pct || 0) / 100)
    }
    setLignes(nl)
  }

  const montantHT = lignes.reduce((s, l) => s + l.montant_ht, 0)
  const montantTTC = montantHT * 1.2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('societe_id').eq('id', user?.id || '').single()
    const numero = `CMD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
    const { data: commande, error: err } = await supabase.from('commandes_materiaux').insert({
      ...formData,
      fournisseur_id: formData.fournisseur_id || null,
      chantier_id: formData.chantier_id || null,
      date_livraison_souhaitee: formData.date_livraison_souhaitee || null,
      societe_id: profile?.societe_id, numero, montant_ht: montantHT, taux_tva: 20, montant_ttc: montantTTC, cree_par: user?.id,
    }).select().single()
    if (err || !commande) { setError(err?.message || 'Erreur'); setLoading(false); return }
    await supabase.from('commande_lignes').insert(lignes.map((l, i) => ({ ...l, commande_id: commande.id, position: i + 1, quantite_livree: 0 })))
    router.push('/materiaux')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/materiaux" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle commande de matériaux</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <select value={formData.fournisseur_id} onChange={(e) => setFormData({ ...formData, fournisseur_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Sélectionner</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
              <select value={formData.chantier_id} onChange={(e) => setFormData({ ...formData, chantier_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Aucun</option>
                {chantiers.map(c => <option key={c.id} value={c.id}>{c.numero} - {c.nom}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
              <input type="text" value={formData.objet} onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de commande</label>
              <input type="date" value={formData.date_commande} onChange={(e) => setFormData({ ...formData, date_commande: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date livraison souhaitée</label>
              <input type="date" value={formData.date_livraison_souhaitee} onChange={(e) => setFormData({ ...formData, date_livraison_souhaitee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Articles</h2>
            <button type="button" onClick={() => setLignes([...lignes, { position: lignes.length + 1, reference_produit: '', designation: '', unite: 'u', quantite_commandee: 1, prix_unitaire_ht: 0, remise_pct: 0, montant_ht: 0 }])}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"><Plus className="w-4 h-4" /> Ajouter</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs text-gray-500 px-3 py-2">Désignation</th>
                  <th className="text-left text-xs text-gray-500 px-3 py-2">Unité</th>
                  <th className="text-right text-xs text-gray-500 px-3 py-2">Qté</th>
                  <th className="text-right text-xs text-gray-500 px-3 py-2">P.U. HT</th>
                  <th className="text-right text-xs text-gray-500 px-3 py-2">Montant HT</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-3 py-2"><input type="text" value={l.designation} onChange={(e) => updateLigne(i, 'designation', e.target.value)} className="w-full border-0 border-b border-gray-200 py-1 text-sm focus:outline-none focus:border-orange-500" /></td>
                    <td className="px-3 py-2"><input type="text" value={l.unite} onChange={(e) => updateLigne(i, 'unite', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-sm" /></td>
                    <td className="px-3 py-2"><input type="number" value={l.quantite_commandee} onChange={(e) => updateLigne(i, 'quantite_commandee', parseFloat(e.target.value) || 0)} className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-right" /></td>
                    <td className="px-3 py-2"><input type="number" step="0.01" value={l.prix_unitaire_ht} onChange={(e) => updateLigne(i, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)} className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right" /></td>
                    <td className="px-3 py-2 text-right font-medium">{l.montant_ht.toFixed(2)} €</td>
                    <td className="px-3 py-2"><button type="button" onClick={() => setLignes(lignes.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr><td colSpan={4} className="px-4 py-2 text-right text-sm font-medium">Total HT</td><td className="px-4 py-2 text-right font-bold">{montantHT.toFixed(2)} €</td><td></td></tr>
                <tr><td colSpan={4} className="px-4 py-2 text-right text-sm font-medium">TVA 20%</td><td className="px-4 py-2 text-right font-bold">{(montantHT * 0.2).toFixed(2)} €</td><td></td></tr>
                <tr><td colSpan={4} className="px-4 py-2 text-right text-sm font-bold">Total TTC</td><td className="px-4 py-2 text-right font-bold text-orange-600">{montantTTC.toFixed(2)} €</td><td></td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/materiaux" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}Créer la commande
          </button>
        </div>
      </form>
    </div>
  )
}
