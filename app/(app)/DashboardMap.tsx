'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface Chantier {
  id: string
  nom: string
  statut: string
  latitude: number
  longitude: number
  avancement_pct: number
}

const STATUT_COLOR: Record<string, string> = {
  en_cours:    '#22c55e',
  planifie:    '#3b82f6',
  preparation: '#3b82f6',
  pause:       '#f59e0b',
  termine:     '#6b7280',
}

export default function DashboardMap({ chantiers }: { chantiers: Chantier[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return

    async function init() {
      const L = (await import('leaflet')).default

      delete (L.Icon.Default.prototype as any)._getIconUrl

      const center: [number, number] = chantiers.length > 0
        ? [chantiers[0].latitude, chantiers[0].longitude]
        : [46.5, 2.5]
      const zoom = chantiers.length > 0 ? 8 : 6

      const map = L.map(mapRef.current!, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView(center, zoom)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      chantiers.forEach(c => {
        const color = STATUT_COLOR[c.statut] ?? '#9ca3af'
        const icon = L.divIcon({
          html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -30],
        })

        L.marker([c.latitude, c.longitude], { icon })
          .addTo(map)
          .bindPopup(`<div style="font-family:system-ui;min-width:150px">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px">${c.nom}</div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:6px">Avancement : ${c.avancement_pct || 0}%</div>
            <a href="/chantiers/${c.id}" style="font-size:12px;color:#f97316;font-weight:500">Voir le chantier →</a>
          </div>`, { maxWidth: 200 })
      })

      if (chantiers.length > 1) {
        const bounds = L.latLngBounds(chantiers.map(c => [c.latitude, c.longitude]))
        map.fitBounds(bounds, { padding: [30, 30] })
      }
    }

    init()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  if (chantiers.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden xl:col-span-2">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-500" />
          <h2 className="font-semibold text-gray-900">Chantiers sur la carte</h2>
          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
            {chantiers.length} localisé{chantiers.length > 1 ? 's' : ''}
          </span>
        </div>
        <Link href="/carte" className="text-sm text-orange-600 hover:underline">Voir la carte →</Link>
      </div>
      <div ref={mapRef} style={{ height: '320px', width: '100%' }} />
    </div>
  )
}
