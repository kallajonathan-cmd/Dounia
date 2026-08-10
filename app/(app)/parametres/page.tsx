'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Building2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ParametresPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'societe' | 'profil'>('societe')
  const [societe, setSociete] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [profileData, setProfileData] = useState({ nom: '', prenom: '', telephone: '' })
  const [societeData, setSocieteData] = useState<any>({})

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('user_profiles').select('*, societes(*)').eq('id', user?.id || '').single()
      setProfile(p)
      setSociete(p?.societes)
      setProfileData({ nom: p?.nom || '', prenom: p?.prenom || '', telephone: p?.telephone || '' })
      setSocieteData(p?.societes || {})
      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('user_profiles').update(profileData).eq('id', profile?.id)
    setSaving(false)
    router.refresh()
  }

  const saveSociete = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('societes').update(societeData).eq('id', societe?.id)
    setSaving(false)
    router.refresh()
  }

  if (loading) return <div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[{ key: 'societe' as const, label: 'Entreprise', icon: <Building2 className="w-4 h-4" /> }, { key: 'profil' as const, label: 'Mon profil', icon: <User className="w-4 h-4" /> }].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{icon}{label}</button>
        ))}
      </div>

      {activeTab === 'societe' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4">Informations de l&apos;entreprise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'nom', label: 'Raison sociale', type: 'text', span: 2 },
              { key: 'siret', label: 'SIRET', type: 'text', span: 1 },
              { key: 'telephone', label: 'Téléphone', type: 'tel', span: 1 },
              { key: 'email', label: 'Email', type: 'email', span: 1 },
              { key: 'site_web', label: 'Site web', type: 'url', span: 1 },
              { key: 'adresse', label: 'Adresse', type: 'text', span: 2 },
              { key: 'code_postal', label: 'Code postal', type: 'text', span: 1 },
              { key: 'ville', label: 'Ville', type: 'text', span: 1 },
              { key: 'iban', label: 'IBAN', type: 'text', span: 1 },
              { key: 'bic', label: 'BIC', type: 'text', span: 1 },
            ].map(({ key, label, type, span }) => (
              <div key={key} className={span === 2 ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={(societeData as any)[key] || ''}
                  onChange={(e) => setSocieteData({ ...societeData, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={saveSociete} disabled={saving}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Enregistrer
            </button>
          </div>
        </div>
      )}

      {activeTab === 'profil' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-md">
          <h2 className="font-semibold text-gray-900 mb-4">Mon profil</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" value={profileData.prenom} onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" value={profileData.nom} onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={profileData.telephone} onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={saveProfile} disabled={saving}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
