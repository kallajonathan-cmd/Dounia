'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Search, Trash2, CheckCircle, AlertCircle, Loader2, MousePointer } from 'lucide-react'

interface ChantierMapProps {
  chantierId: string
  adresse?: string
  codePostal?: string
  ville?: string
  initialLat?: number | null
  initialLng?: number | null
}

export default function ChantierMap({
  chantierId,
  adresse,
  codePostal,
  ville,
  initialLat,
  initialLng,
}: ChantierMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const LRef = useRef<any>(null)

  const [lat, setLat] = useState<number | null>(initialLat ?? null)
  const [lng, setLng] = useState<number | null>(initialLng ?? null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [clickMode, setClickMode] = useState(false)

  const hasAddress = !!(adresse || codePostal || ville)
  const addressLabel = [adresse, codePostal, ville].filter(Boolean).join(', ')

  // Place / move marker on the map
  const placeMarker = useCallback((latitude: number, longitude: number) => {
    const L = LRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude])
    } else {
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#f97316;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })
      markerRef.current = L.marker([latitude, longitude], { icon, draggable: true }).addTo(map)

      // Save on drag end
      markerRef.current.on('dragend', async (e: any) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng()
        setLat(newLat)
        setLng(newLng)
        await saveCoords(newLat, newLng)
      })
    }

    map.setView([latitude, longitude], Math.max(map.getZoom(), 14))
  }, [])

  const saveCoords = useCallback(async (latitude: number, longitude: number) => {
    setStatus('loading')
    setMessage(null)
    try {
      const res = await fetch(`/api/chantiers/${chantierId}/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setStatus('success')
      setMessage('Coordonnées sauvegardées')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }, [chantierId])

  // Geocode from address
  const geocodeAddress = useCallback(async () => {
    setStatus('loading')
    setMessage(null)
    try {
      const res = await fetch(`/api/chantiers/${chantierId}/geocode`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setLat(data.latitude)
      setLng(data.longitude)
      placeMarker(data.latitude, data.longitude)
      setStatus('success')
      setMessage('Chantier géolocalisé avec succès')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }, [chantierId, placeMarker])

  // Remove coordinates
  const removeCoords = useCallback(async () => {
    if (!confirm('Supprimer la géolocalisation de ce chantier ?')) return
    setStatus('loading')
    try {
      await fetch(`/api/chantiers/${chantierId}/geocode`, { method: 'DELETE' })
      setLat(null)
      setLng(null)
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current)
        markerRef.current = null
      }
      setStatus('idle')
      setMessage('Géolocalisation supprimée')
      setTimeout(() => setMessage(null), 3000)
    } catch {
      setStatus('error')
      setMessage('Erreur lors de la suppression')
    }
  }, [chantierId])

  // Init map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    if (mapInstanceRef.current) return

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      LRef.current = L

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center: [number, number] = initialLat && initialLng
        ? [initialLat, initialLng]
        : [46.5, 2.5]
      const zoom = initialLat && initialLng ? 14 : 6

      const map = L.map(mapRef.current!, { zoomControl: true }).setView(center, zoom)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      if (initialLat && initialLng) {
        placeMarker(initialLat, initialLng)
      }

      // Click to place marker
      map.on('click', async (e: any) => {
        // Check click mode via ref to avoid stale closure
        if (!clickModeRef.current) return
        const { lat: clickLat, lng: clickLng } = e.latlng
        setLat(clickLat)
        setLng(clickLng)
        placeMarker(clickLat, clickLng)
        await saveCoords(clickLat, clickLng)
      })
    }

    init()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep click mode in a ref to avoid stale closures in the map click handler
  const clickModeRef = useRef(false)
  useEffect(() => {
    clickModeRef.current = clickMode
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getContainer().style.cursor = clickMode ? 'crosshair' : ''
    }
  }, [clickMode])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Localisation</h3>
            {lat && lng && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                Géolocalisé
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lat && lng && (
              <button
                onClick={removeCoords}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            )}
            <button
              onClick={() => setClickMode(m => !m)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                clickMode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              {clickMode ? 'Cliquez sur la carte…' : 'Placer manuellement'}
            </button>
            {hasAddress && (
              <button
                onClick={geocodeAddress}
                disabled={status === 'loading'}
                className="flex items-center gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                Géocoder l'adresse
              </button>
            )}
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
            status === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {status === 'error'
              ? <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              : <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
            {message}
          </div>
        )}

        {/* Address display */}
        {addressLabel && (
          <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {addressLabel}
          </p>
        )}

        {/* Coordinates display */}
        {lat && lng && (
          <p className="mt-1 text-xs text-gray-400 font-mono">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="h-72 w-full z-0" />

      {!lat && !lng && (
        <div className="px-5 py-3 bg-yellow-50 border-t border-yellow-100 text-xs text-yellow-700 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {hasAddress
            ? 'Ce chantier n\'est pas encore géolocalisé. Cliquez sur "Géocoder l\'adresse" ou placez le marqueur manuellement.'
            : 'Ajoutez une adresse au chantier puis géocodez-la, ou placez le marqueur manuellement.'}
        </div>
      )}
    </div>
  )
}
