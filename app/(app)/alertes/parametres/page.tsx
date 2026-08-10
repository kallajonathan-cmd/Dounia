'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AlertesParametresPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState({ whatsapp: '', alertes_whatsapp: true, alertes_email: true, alerte_devis_expiration: true, alerte_facture_echeance: true, alerte_assurance_expiration: true, alerte_titre_sejour_expiration: true })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user?.id || '').single()
      setProfile(p)
      if (p?.whatsapp) setSettings(s => ({ ...s, whatsapp: p.whatsapp }))
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('user_profiles').update({ whatsapp: settings.whatsapp }).eq('id', profile?.id)
    setSaving(false)
    router.refresh()
  }

  if (loading) return <div className="p-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/alertes" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres des alertes</h1>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Canaux de notification</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro WhatsApp</label>
            <input type="tel" value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              placeholder="+33 6 12 34 56 78" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <p className="text-xs text-gray-400 mt-1">Format international: +33...</p>
          </div>
          <div className="space-y-3">
            {[{ key: 'alertes_whatsapp', label: 'Recevoir les alertes par WhatsApp' }, { key: 'alertes_email', label: 'Recevoir les alertes par email' }].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${(settings as any)[key] ? 'bg-orange-500' : 'bg-gray-200'}`}
                  onClick={() => setSettings({ ...settings, [key]: !(settings as any)[key] })}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(settings as any)[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Types d&apos;alertes</h2>
          <div className="space-y-3">
            {[{ key: 'alerte_devis_expiration', label: 'Devis arrivant à expiration' }, { key: 'alerte_facture_echeance', label: 'Factures arrivant à échéance' },
              { key: 'alerte_assurance_expiration', label: 'Assurances à renouveler' }, { key: 'alerte_titre_sejour_expiration', label: 'Titres de séjour expirant' }].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={(settings as any)[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })} className="w-4 h-4 text-orange-500 rounded" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
