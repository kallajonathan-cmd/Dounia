import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, MapPin, Calendar, Users, Package, TrendingUp } from 'lucide-react'
import { formatDate, formatCurrency, getStatutChantierColor, getStatutChantierLabel } from '@/lib/utils'
import ChantierMap from './ChantierMap'

export default async function ChantierDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: chantier } = await supabase
    .from('chantiers')
    .select('*, clients(*)')
    .eq('id', params.id)
    .single()

  if (!chantier) notFound()

  const [{ data: lots }, { data: journal }, { data: photos }] = await Promise.all([
    supabase.from('chantier_lots').select('*').eq('chantier_id', params.id).order('position'),
    supabase.from('chantier_journal').select('*').eq('chantier_id', params.id).order('date', { ascending: false }).limit(5),
    supabase.from('chantier_photos').select('*').eq('chantier_id', params.id).order('created_at', { ascending: false }).limit(6),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/chantiers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{chantier.nom}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm font-mono">{chantier.numero}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatutChantierColor(chantier.statut)}`}>
                {getStatutChantierLabel(chantier.statut)}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/chantiers/${params.id}/modifier`}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Edit className="w-4 h-4" /> Modifier
        </Link>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Avancement global</span>
          <span className="text-lg font-bold text-orange-600">{chantier.avancement_pct || 0}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all"
            style={{ width: `${chantier.avancement_pct || 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Informations</h3>
            <div className="space-y-2 text-sm">
              {(chantier as any).clients && (
                <div>
                  <span className="text-gray-500">Client</span>
                  <Link href={`/clients/${(chantier as any).clients.id}`} className="ml-2 font-medium text-blue-600 hover:underline">
                    {(chantier as any).clients.nom}
                  </Link>
                </div>
              )}
              {chantier.type_travaux && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span>{chantier.type_travaux}</span>
                </div>
              )}
              {(chantier.adresse || chantier.ville) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{[chantier.adresse, chantier.code_postal, chantier.ville].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" /> Dates
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Début prévu</span>
                <span>{formatDate(chantier.date_debut_prevue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fin prévue</span>
                <span>{formatDate(chantier.date_fin_prevue)}</span>
              </div>
              {chantier.date_debut_reelle && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Début réel</span>
                  <span className="text-green-600">{formatDate(chantier.date_debut_reelle)}</span>
                </div>
              )}
              {chantier.date_fin_reelle && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fin réelle</span>
                  <span className="text-green-600">{formatDate(chantier.date_fin_reelle)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" /> Budget
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Budget HT</span>
                <span className="font-medium">{chantier.budget_ht ? formatCurrency(chantier.budget_ht) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Coût réel HT</span>
                <span className="font-medium">{chantier.cout_reel_ht ? formatCurrency(chantier.cout_reel_ht) : '-'}</span>
              </div>
              {chantier.marge_prevue_pct && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Marge prévue</span>
                  <span className="font-medium text-green-600">{chantier.marge_prevue_pct}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Lots */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Lots de travaux</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {lots && lots.length > 0 ? lots.map((lot) => (
                <div key={lot.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{lot.nom}</p>
                    <span className="text-xs text-gray-500">{lot.avancement_pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${lot.avancement_pct}%`, backgroundColor: lot.couleur || '#f97316' }}
                    />
                  </div>
                  {(lot.date_debut || lot.date_fin) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(lot.date_debut)} → {formatDate(lot.date_fin)}
                    </p>
                  )}
                </div>
              )) : (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucun lot défini</p>
              )}
            </div>
          </div>

          {/* Journal */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Journal de chantier</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {journal && journal.length > 0 ? journal.map((j) => (
                <div key={j.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{formatDate(j.date)}</p>
                    <span className="text-xs text-gray-500">Effectif: {j.effectif || 0} pers.</span>
                  </div>
                  {j.travaux_realises && (
                    <p className="text-xs text-gray-600 line-clamp-2">{j.travaux_realises}</p>
                  )}
                  {j.conditions_meteo && (
                    <p className="text-xs text-blue-500 mt-1">☁ {j.conditions_meteo} — {j.temperature_matin}°C</p>
                  )}
                </div>
              )) : (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucune entrée dans le journal</p>
              )}
            </div>
          </div>

          {/* Map */}
          <ChantierMap
            chantierId={params.id}
            adresse={chantier.adresse}
            codePostal={chantier.code_postal}
            ville={chantier.ville}
            initialLat={chantier.latitude}
            initialLng={chantier.longitude}
          />

          {/* Photos */}
          {photos && photos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Photos ({photos.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={p.miniature_url || p.url} alt={p.nom || ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
