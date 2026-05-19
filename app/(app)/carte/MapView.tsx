'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MapPin, ExternalLink } from 'lucide-react'
import { getStatutChantierLabel } from '@/lib/utils'

interface Chantier {
  id: string
  nom: string
  adresse?: string
  code_postal?: string
  ville?: string
  statut: string
  avancement_pct: number
  latitude?: number
  longitude?: number
  clients?: { nom: string }
}

const STATUT_CONFIG: Record<string, { color: string; label: string; dot: string }> = {
  en_cours:    { color: '#22c55e', label: 'En Cours',  dot: 'bg-green-500' },
  planifie:    { color: '#3b82f6', label: 'Planifié',  dot: 'bg-blue-500' },
  preparation: { color: '#3b82f6', label: 'Planifié',  dot: 'bg-blue-500' },
  pause:       { color: '#f59e0b', label: 'Pause',     dot: 'bg-yellow-500' },
  termine:     { color: '#6b7280', label: 'Terminé',   dot: 'bg-gray-500' },
}

function getStatutColor(statut: string) {
  return STATUT_CONFIG[statut]?.color ?? '#9ca3af'
}
function getStatutDot(statut: string) {
  return STATUT_CONFIG[statut]?.dot ?? 'bg-gray-400'
}

export default function MapView({ chantiers }: { chantiers: Chantier[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const withCoords = chantiers.filter(c => c.latitude && c.longitude)
  const withoutCoords = chantiers.filter(c => !c.latitude || !c.longitude)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    if (mapInstanceRef.current) return // already initialized

    let L: any
    let map: any

    async function init() {
      // Dynamic import to avoid SSR issues
      L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Fix default marker icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Center on France by default, or fit to markers if any
      const center: [number, number] = withCoords.length > 0
        ? [withCoords[0].latitude!, withCoords[0].longitude!]
        : [46.5, 2.5]
      const zoom = withCoords.length > 0 ? 8 : 6

      map = L.map(mapRef.current!, { zoomControl: true }).setView(center, zoom)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Add markers for each chantier with coordinates
      withCoords.forEach(c => {
        const color = getStatutColor(c.statut)

        // Custom colored circle marker
        const markerHtml = `
          <div style="
            width: 32px; height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `

        const icon = L.divIcon({
          html: markerHtml,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -34],
        })

        const popupContent = `
          <div style="min-width: 200px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${c.nom}</div>
            ${c.clients?.nom ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${c.clients.nom}</div>` : ''}
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              ${[c.adresse, c.code_postal, c.ville].filter(Boolean).join(', ') || 'Adresse non renseignée'}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 11px; background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 9999px; font-weight: 500;">
                ${STATUT_CONFIG[c.statut]?.label ?? c.statut}
              </span>
              <span style="font-size: 12px; color: #374151; font-weight: 500;">${c.avancement_pct || 0}%</span>
            </div>
            <div style="background: #f3f4f6; border-radius: 9999px; height: 6px; overflow: hidden;">
              <div style="background: #f97316; height: 6px; width: ${c.avancement_pct || 0}%; border-radius: 9999px;"></div>
            </div>
            <a href="/chantiers/${c.id}" style="display: block; margin-top: 10px; font-size: 12px; color: #f97316; text-decoration: none; font-weight: 500;">
              Voir le chantier →
            </a>
          </div>
        `

        L.marker([c.latitude!, c.longitude!], { icon })
          .addTo(map)
          .bindPopup(popupContent, { maxWidth: 260 })
      })

      // Fit bounds if multiple markers
      if (withCoords.length > 1) {
        const bounds = L.latLngBounds(withCoords.map(c => [c.latitude!, c.longitude!]))
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }

    init()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Map header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Carte des chantiers</h2>
            <p className="text-sm text-gray-500">
              {withCoords.length} chantiers géolocalisés
              {withoutCoords.length > 0 && ` · ${withoutCoords.length} sans coordonnées GPS`}
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            {Object.entries(STATUT_CONFIG).filter(([k]) => ['en_cours','planifie','pause','termine'].includes(k)).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
                <span className="text-gray-600 text-xs">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map container */}
        <div ref={mapRef} className="h-[500px] w-full z-0" />
      </div>

      {/* Chantiers list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {chantiers.map((c) => (
          <Link
            key={c.id}
            href={`/chantiers/${c.id}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${getStatutDot(c.statut)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.nom}</p>
                <p className="text-xs text-gray-500">{c.clients?.nom}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">
                    {[c.adresse, c.code_postal, c.ville].filter(Boolean).join(', ') || 'Adresse non renseignée'}
                  </span>
                </div>
                {!c.latitude && (
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                    GPS non géocodé
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Avancement</span>
                <span>{c.avancement_pct || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${c.avancement_pct || 0}%` }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {chantiers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Aucun chantier actif</p>
        </div>
      )}
    </div>
  )
}
