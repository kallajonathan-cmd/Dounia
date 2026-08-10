import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy', { locale: fr })
  } catch {
    return '-'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch {
    return '-'
  }
}

export function getStatutDevisColor(statut: string): string {
  const colors: Record<string, string> = {
    brouillon: 'bg-gray-100 text-gray-700',
    envoye: 'bg-blue-100 text-blue-700',
    accepte: 'bg-green-100 text-green-700',
    refuse: 'bg-red-100 text-red-700',
    expire: 'bg-orange-100 text-orange-700',
  }
  return colors[statut] || 'bg-gray-100 text-gray-700'
}

export function getStatutDevisLabel(statut: string): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoye: 'Envoyé',
    accepte: 'Accepté',
    refuse: 'Refusé',
    expire: 'Expiré',
  }
  return labels[statut] || statut
}

export function getStatutFactureColor(statut: string): string {
  const colors: Record<string, string> = {
    brouillon: 'bg-gray-100 text-gray-700',
    envoyee: 'bg-blue-100 text-blue-700',
    partiellement_payee: 'bg-yellow-100 text-yellow-700',
    payee: 'bg-green-100 text-green-700',
    en_retard: 'bg-red-100 text-red-700',
    annulee: 'bg-gray-100 text-gray-500',
  }
  return colors[statut] || 'bg-gray-100 text-gray-700'
}

export function getStatutFactureLabel(statut: string): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoyee: 'Envoyée',
    partiellement_payee: 'Part. payée',
    payee: 'Payée',
    en_retard: 'En retard',
    annulee: 'Annulée',
  }
  return labels[statut] || statut
}

export function getStatutChantierColor(statut: string): string {
  const colors: Record<string, string> = {
    preparation: 'bg-purple-100 text-purple-700',
    en_cours: 'bg-blue-100 text-blue-700',
    pause: 'bg-yellow-100 text-yellow-700',
    termine: 'bg-green-100 text-green-700',
    annule: 'bg-red-100 text-red-700',
  }
  return colors[statut] || 'bg-gray-100 text-gray-700'
}

export function getStatutChantierLabel(statut: string): string {
  const labels: Record<string, string> = {
    preparation: 'Préparation',
    en_cours: 'En cours',
    pause: 'En pause',
    termine: 'Terminé',
    annule: 'Annulé',
  }
  return labels[statut] || statut
}

export function getNiveauAlerteColor(niveau: string): string {
  const colors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    success: 'bg-green-100 text-green-700 border-green-200',
  }
  return colors[niveau] || 'bg-gray-100 text-gray-700 border-gray-200'
}
