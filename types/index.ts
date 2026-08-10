export interface Societe {
  id: string
  nom: string
  siret?: string
  siren?: string
  forme_juridique?: string
  capital?: number
  adresse?: string
  code_postal?: string
  ville?: string
  telephone?: string
  email?: string
  site_web?: string
  logo_url?: string
  couleur_principale?: string
  tva_intracommunautaire?: string
  rcs?: string
  ape?: string
  iban?: string
  bic?: string
  mention_legale?: string
  created_at: string
}

export interface UserProfile {
  id: string
  societe_id: string
  role: string
  nom: string
  prenom: string
  telephone?: string
  avatar_url?: string
  whatsapp?: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  societe_id: string
  type: 'particulier' | 'professionnel'
  nom: string
  siret?: string
  adresse?: string
  code_postal?: string
  ville?: string
  email?: string
  telephone?: string
  contact_nom?: string
  contact_prenom?: string
  notes?: string
  ca_total?: number
  nb_chantiers?: number
  created_at: string
  updated_at: string
}

export interface Devis {
  id: string
  societe_id: string
  client_id: string
  numero: string
  reference_client?: string
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
  objet: string
  description?: string
  type_travaux?: string
  adresse_chantier?: string
  code_postal_chantier?: string
  ville_chantier?: string
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  validite_jours: number
  date_creation: string
  date_envoi?: string
  date_validite?: string
  date_acceptation?: string
  conditions_paiement?: string
  notes?: string
  notes_internes?: string
  genere_par_ia?: boolean
  ia_prompt?: string
  nb_relances?: number
  derniere_relance?: string
  signature_url?: string
  signe_le?: string
  created_by?: string
  created_at: string
  updated_at: string
  clients?: Client
}

export interface DevisLigne {
  id: string
  devis_id: string
  position: number
  type: string
  designation: string
  description?: string
  unite?: string
  quantite: number
  prix_unitaire_ht: number
  taux_tva: number
  montant_ht: number
  created_at: string
}

export interface Chantier {
  id: string
  societe_id: string
  devis_id?: string
  client_id?: string
  numero: string
  nom: string
  description?: string
  type_travaux?: string
  statut: 'preparation' | 'en_cours' | 'pause' | 'termine' | 'annule'
  avancement_pct: number
  adresse?: string
  code_postal?: string
  ville?: string
  latitude?: number
  longitude?: number
  date_debut_prevue?: string
  date_fin_prevue?: string
  date_debut_reelle?: string
  date_fin_reelle?: string
  budget_ht?: number
  cout_reel_ht?: number
  marge_prevue_pct?: number
  chef_chantier_id?: string
  alerte_meteo_active?: boolean
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  clients?: Client
}

export interface ChantierLot {
  id: string
  chantier_id: string
  nom: string
  description?: string
  position: number
  date_debut?: string
  date_fin?: string
  avancement_pct: number
  couleur?: string
  responsable_id?: string
  created_at: string
}

export interface Facture {
  id: string
  societe_id: string
  chantier_id?: string
  devis_id?: string
  client_id: string
  numero: string
  type: 'facture' | 'acompte' | 'situation' | 'avoir'
  statut: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'en_retard' | 'annulee'
  objet: string
  pourcentage_acompte?: number
  numero_situation?: number
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  montant_paye: number
  montant_restant: number
  date_emission: string
  date_echeance?: string
  date_paiement?: string
  conditions_paiement?: string
  notes?: string
  nb_relances?: number
  derniere_relance?: string
  pdf_url?: string
  created_by?: string
  created_at: string
  updated_at: string
  clients?: Client
}

export interface SousTraitant {
  id: string
  societe_id: string
  nom: string
  siret?: string
  adresse?: string
  code_postal?: string
  ville?: string
  email?: string
  telephone?: string
  contact_nom?: string
  specialites?: string[]
  kbis_url?: string
  kbis_date_validite?: string
  attestation_urssaf_url?: string
  attestation_urssaf_date?: string
  assurance_rc_url?: string
  assurance_rc_date_validite?: string
  assurance_decennale_url?: string
  assurance_decennale_date_validite?: string
  conforme?: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Fournisseur {
  id: string
  societe_id: string
  nom: string
  type?: string
  enseigne?: string
  email?: string
  telephone?: string
  commercial_nom?: string
  commercial_email?: string
  commercial_telephone?: string
  compte_client?: string
  conditions_paiement?: string
  remise_pct?: number
  notes?: string
  created_at: string
}

export interface CommandeMateriaux {
  id: string
  societe_id: string
  chantier_id?: string
  fournisseur_id?: string
  numero: string
  statut: 'brouillon' | 'envoyee' | 'confirmee' | 'livree_partiel' | 'livree' | 'annulee'
  objet?: string
  date_commande: string
  date_livraison_souhaitee?: string
  date_livraison_reelle?: string
  adresse_livraison?: string
  montant_ht?: number
  taux_tva?: number
  montant_ttc?: number
  reference_fournisseur?: string
  notes?: string
  cree_par?: string
  created_at: string
  updated_at: string
  fournisseurs?: Fournisseur
  chantiers?: Chantier
}

export interface Assurance {
  id: string
  societe_id: string
  type: string
  compagnie: string
  numero_contrat?: string
  objet?: string
  montant_prime_annuelle?: number
  date_souscription?: string
  date_debut?: string
  date_echeance?: string
  date_renouvellement?: string
  tacite_reconduction?: boolean
  contrat_url?: string
  attestation_url?: string
  attestation_date_validite?: string
  nb_sinistres?: number
  alerte_60j?: boolean
  alerte_30j?: boolean
  alerte_15j?: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Personnel {
  id: string
  societe_id: string
  user_id?: string
  nom: string
  prenom: string
  date_naissance?: string
  nationalite?: string
  adresse?: string
  email?: string
  telephone?: string
  poste?: string
  statut: 'actif' | 'inactif' | 'conge'
  type_titre_sejour?: string
  numero_titre_sejour?: string
  date_validite_titre?: string
  salaire_brut?: number
  photo_url?: string
  created_at: string
  updated_at: string
}

export interface Alerte {
  id: string
  societe_id: string
  type: string
  niveau: 'info' | 'warning' | 'error' | 'success'
  titre: string
  message: string
  lien_type?: string
  lien_id?: string
  destinataire_id?: string
  lue: boolean
  lue_le?: string
  envoyee_whatsapp?: boolean
  envoyee_email?: boolean
  created_at: string
}
