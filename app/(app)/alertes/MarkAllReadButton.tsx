'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCheck, Loader2 } from 'lucide-react'

export default function MarkAllReadButton({ societeId }: { societeId?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleMarkAll = async () => {
    if (!societeId) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('alertes').update({ lue: true, lue_le: new Date().toISOString() }).eq('societe_id', societeId).eq('lue', false)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={handleMarkAll} disabled={loading}
      className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
      Tout marquer lu
    </button>
  )
}
