import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const in60Days = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
    const alertes: any[] = []

    const { data: devisExpirants } = await supabase
      .from('devis').select('*, clients(nom)').eq('statut', 'envoye')
      .lte('date_validite', in30Days).gte('date_validite', today)

    devisExpirants?.forEach(d => {
      alertes.push({
        societe_id: d.societe_id, type: 'devis_expiration', niveau: 'warning',
        titre: 'Devis bientôt expiré',
        message: `Le devis ${d.numero} pour ${d.clients?.nom} expire le ${d.date_validite}`,
        lien_type: 'devis', lien_id: d.id, lue: false,
      })
    })

    const { data: facturesEnRetard } = await supabase
      .from('factures').select('*, clients(nom)').in('statut', ['envoyee', 'partiellement_payee']).lt('date_echeance', today)

    facturesEnRetard?.forEach(f => {
      alertes.push({
        societe_id: f.societe_id, type: 'facture_retard', niveau: 'error',
        titre: 'Facture en retard de paiement',
        message: `La facture ${f.numero} de ${f.clients?.nom} est en retard (échéance: ${f.date_echeance})`,
        lien_type: 'facture', lien_id: f.id, lue: false,
      })
      supabase.from('factures').update({ statut: 'en_retard' }).eq('id', f.id)
    })

    const { data: assurancesExpirant } = await supabase
      .from('assurances').select('*').lte('date_echeance', in60Days).gte('date_echeance', today)

    assurancesExpirant?.forEach(a => {
      const daysDiff = Math.ceil((new Date(a.date_echeance).getTime() - Date.now()) / 86400000)
      alertes.push({
        societe_id: a.societe_id, type: 'assurance_expiration',
        niveau: daysDiff <= 15 ? 'error' : 'warning',
        titre: 'Assurance à renouveler',
        message: `L'assurance ${a.type} chez ${a.compagnie} expire dans ${daysDiff} jour(s)`,
        lien_type: 'assurance', lien_id: a.id, lue: false,
      })
    })

    if (alertes.length > 0) await supabase.from('alertes').insert(alertes)

    return NextResponse.json({ success: true, alertes_created: alertes.length, timestamp: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
