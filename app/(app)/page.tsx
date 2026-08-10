import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getStatutChantierColor, getStatutChantierLabel } from '@/lib/utils'
import { HardHat, Receipt, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import DashboardMap from './DashboardMap'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, societes(*)')
    .eq('id', user?.id || '')
    .single()

  const societeId = profile?.societe_id

  const [
    { data: chantiers },
    { data: devis },
    { data: factures },
    { data: clients },
    { data: alertes },
    { data: chantiersGeo },
  ] = await Promise.all([
    supabase.from('chantiers').select('*').eq('societe_id', societeId || '').order('created_at', { ascending: false }).limit(5),
    supabase.from('devis').select('*, clients(nom)').eq('societe_id', societeId || '').order('created_at', { ascending: false }).limit(5),
    supabase.from('factures').select('*').eq('societe_id', societeId || ''),
    supabase.from('clients').select('id').eq('societe_id', societeId || ''),
    supabase.from('alertes').select('*').eq('societe_id', societeId || '').eq('lue', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('chantiers').select('id, nom, statut, latitude, longitude, avancement_pct').eq('societe_id', societeId || '').not('latitude', 'is', null).not('statut', 'eq', 'annule'),
  ])

  const chantiersEnCours = chantiers?.filter(c => c.statut === 'en_cours').length || 0
  const totalFactures = factures?.reduce((sum, f) => sum + (f.montant_ttc || 0), 0) || 0
  const facturesImpayees = factures?.filter(f => ['envoyee', 'en_retard', 'partiellement_payee'].includes(f.statut))
  const montantImpaye = facturesImpayees?.reduce((sum, f) => sum + (f.montant_restant || 0), 0) || 0
  const devisEnAttente = devis?.filter(d => d.statut === 'envoye').length || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenue, {profile?.prenom} {profile?.nom} — {profile?.societes?.nom}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Chantiers en cours" value={chantiersEnCours.toString()} icon={<HardHat className="w-6 h-6 text-blue-600" />} bg="bg-blue-50" link="/chantiers" subtitle={`${chantiers?.length || 0} au total`} />
        <KPICard title="CA Facturé (TTC)" value={formatCurrency(totalFactures)} icon={<Receipt className="w-6 h-6 text-green-600" />} bg="bg-green-50" link="/facturation" subtitle={`${factures?.length || 0} factures`} />
        <KPICard title="Montant impayé" value={formatCurrency(montantImpaye)} icon={<TrendingUp className="w-6 h-6 text-orange-600" />} bg="bg-orange-50" link="/facturation" subtitle={`${facturesImpayees?.length || 0} factures`} />
        <KPICard title="Devis en attente" value={devisEnAttente.toString()} icon={<FileText className="w-6 h-6 text-purple-600" />} bg="bg-purple-50" link="/devis" subtitle={`${clients?.length || 0} clients`} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Chantiers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Chantiers récents</h2>
            <Link href="/chantiers" className="text-sm text-orange-600 hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {chantiers && chantiers.length > 0 ? chantiers.map((c) => (
              <Link key={c.id} href={`/chantiers/${c.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.nom}</p>
                  <p className="text-xs text-gray-500">{c.ville} — {c.numero}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${c.avancement_pct || 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{c.avancement_pct || 0}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatutChantierColor(c.statut)}`}>
                    {getStatutChantierLabel(c.statut)}
                  </span>
                </div>
              </Link>
            )) : (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucun chantier</p>
            )}
          </div>
        </div>

        {/* Recent Devis */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Devis récents</h2>
            <Link href="/devis" className="text-sm text-orange-600 hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {devis && devis.length > 0 ? devis.map((d) => (
              <Link key={d.id} href={`/devis/${d.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.objet}</p>
                  <p className="text-xs text-gray-500">{(d as any).clients?.nom} — {d.numero}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(d.montant_ttc)}</p>
                  <p className="text-xs text-gray-500">{formatDate(d.date_creation)}</p>
                </div>
              </Link>
            )) : (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucun devis</p>
            )}
          </div>
        </div>

        {/* Mini Map */}
        <DashboardMap chantiers={(chantiersGeo || []) as any} />

        {/* Alertes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Alertes non lues
              {alertes && alertes.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">{alertes.length}</span>
              )}
            </h2>
            <Link href="/alertes" className="text-sm text-orange-600 hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {alertes && alertes.length > 0 ? alertes.map((a) => (
              <div key={a.id} className="flex items-start gap-4 px-6 py-3">
                {a.niveau === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                ) : a.niveau === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.titre}</p>
                  <p className="text-xs text-gray-500">{a.message}</p>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(a.created_at)}
                </span>
              </div>
            )) : (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucune alerte non lue</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, icon, bg, link, subtitle }: {
  title: string; value: string; icon: React.ReactNode; bg: string; link: string; subtitle?: string
}) {
  return (
    <Link href={link} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bg} p-3 rounded-xl`}>{icon}</div>
      </div>
    </Link>
  )
}
