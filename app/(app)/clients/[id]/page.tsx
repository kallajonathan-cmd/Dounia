import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Building2, User, Phone, Mail, MapPin, FileText, HardHat, Receipt } from 'lucide-react'
import { formatDate, formatCurrency, getStatutDevisColor, getStatutDevisLabel, getStatutChantierColor, getStatutChantierLabel } from '@/lib/utils'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!client) notFound()

  const [{ data: devis }, { data: chantiers }, { data: factures }] = await Promise.all([
    supabase.from('devis').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
    supabase.from('chantiers').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
    supabase.from('factures').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.nom}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {client.type === 'professionnel' ? 'Client professionnel' : 'Client particulier'}
            </p>
          </div>
        </div>
        <Link
          href={`/clients/${params.id}/modifier`}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
              {client.type === 'professionnel' ? (
                <Building2 className="w-7 h-7 text-blue-600" />
              ) : (
                <User className="w-7 h-7 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{client.nom}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                client.type === 'professionnel' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {client.type === 'professionnel' ? 'Professionnel' : 'Particulier'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {client.telephone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{client.telephone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{client.email}</span>
              </div>
            )}
            {(client.adresse || client.ville) && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>{[client.adresse, client.code_postal, client.ville].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {client.siret && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">SIRET</p>
                <p className="text-sm font-mono">{client.siret}</p>
              </div>
            )}
            {client.contact_nom && (
              <div>
                <p className="text-xs text-gray-500">Contact</p>
                <p className="text-sm">{client.contact_prenom} {client.contact_nom}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{chantiers?.length || 0}</p>
              <p className="text-xs text-gray-500">Chantiers</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-gray-900">{formatCurrency(client.ca_total || 0)}</p>
              <p className="text-xs text-gray-500">CA Total</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Devis */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Devis ({devis?.length || 0})
              </h2>
              <Link href={`/devis/nouveau?client_id=${params.id}`} className="text-sm text-orange-600 hover:underline">
                + Nouveau devis
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {devis && devis.length > 0 ? devis.slice(0, 5).map((d) => (
                <Link key={d.id} href={`/devis/${d.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.objet}</p>
                    <p className="text-xs text-gray-500">{d.numero} — {formatDate(d.date_creation)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(d.montant_ttc)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatutDevisColor(d.statut)}`}>
                      {getStatutDevisLabel(d.statut)}
                    </span>
                  </div>
                </Link>
              )) : (
                <p className="px-6 py-6 text-sm text-gray-400 text-center">Aucun devis</p>
              )}
            </div>
          </div>

          {/* Chantiers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-gray-400" />
                Chantiers ({chantiers?.length || 0})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {chantiers && chantiers.length > 0 ? chantiers.slice(0, 5).map((c) => (
                <Link key={c.id} href={`/chantiers/${c.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.nom}</p>
                    <p className="text-xs text-gray-500">{c.ville} — {c.numero}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${c.avancement_pct || 0}%` }} />
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatutChantierColor(c.statut)}`}>
                      {getStatutChantierLabel(c.statut)}
                    </span>
                  </div>
                </Link>
              )) : (
                <p className="px-6 py-6 text-sm text-gray-400 text-center">Aucun chantier</p>
              )}
            </div>
          </div>

          {/* Factures */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-400" />
                Factures ({factures?.length || 0})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {factures && factures.length > 0 ? factures.slice(0, 5).map((f) => (
                <Link key={f.id} href={`/facturation/${f.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.objet}</p>
                    <p className="text-xs text-gray-500">{f.numero} — {formatDate(f.date_emission)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(f.montant_ttc)}</p>
                </Link>
              )) : (
                <p className="px-6 py-6 text-sm text-gray-400 text-center">Aucune facture</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
