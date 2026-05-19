'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { getStatutChantierColor, getStatutChantierLabel } from '@/lib/utils'

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

export default function MapView({ chantiers }: { chantiers: Chantier[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  const withCoords = chantiers.filter(c => c.latitude && c.longitude)
  const withoutCoords = chantiers.filter(c => !c.latitude || !c.longitude)

  return (
    <div className="space-y-4">
      {/* Map placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-b from-blue-100 to-green-50 h-96 relative flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-blue-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Vue cartographique</p>
            <p className="text-gray-400 text-sm mt-1">
              {withCoords.length > 0
                ? `${withCoords.length} chantier(s) avec coordonnées GPS`
                : 'Aucun chantier avec coordonnées GPS. Géocodez les adresses via les paramètres.'}
            </p>
          </div>
          {/* Simulated pins */}
          {withCoords.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(selected === c.id ? null : c.id)}
              className="absolute w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform"
              style={{
                top: `${20 + (i * 15) % 60}%`,
                left: `${15 + (i * 23) % 70}%`,
              }}
            >
              <MapPin className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* List of all chantiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {chantiers.map((c) => (
          <Link
            key={c.id}
            href={`/chantiers/${c.id}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${
                c.statut === 'en_cours' ? 'bg-blue-400' :
                c.statut === 'preparation' ? 'bg-purple-400' :
                c.statut === 'termine' ? 'bg-green-400' : 'bg-gray-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.nom}</p>
                <p className="text-xs text-gray-500">{c.clients?.nom}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{[c.adresse, c.code_postal, c.ville].filter(Boolean).join(', ') || 'Adresse non renseignée'}</span>
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
