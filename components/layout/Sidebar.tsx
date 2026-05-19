'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  HardHat,
  Receipt,
  Calendar,
  Map,
  CalendarDays,
  UserCog,
  Package,
  Truck,
  Shield,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/devis', icon: FileText, label: 'Devis' },
  { href: '/chantiers', icon: HardHat, label: 'Chantiers' },
  { href: '/facturation', icon: Receipt, label: 'Facturation' },
  { href: '/planning', icon: Calendar, label: 'Planning' },
  { href: '/calendrier', icon: CalendarDays, label: 'Calendrier' },
  { href: '/carte', icon: Map, label: 'Carte' },
  { href: '/personnel', icon: UserCog, label: 'Personnel' },
  { href: '/materiaux', icon: Package, label: 'Matériaux' },
  { href: '/sous-traitants', icon: Truck, label: 'Sous-traitants' },
  { href: '/assurances', icon: Shield, label: 'Assurances' },
  { href: '/alertes', icon: Bell, label: 'Alertes' },
  { href: '/parametres', icon: Settings, label: 'Paramètres' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={cn(
      'relative flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 shadow-xl z-30',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-slate-700',
        collapsed && 'justify-center px-2'
      )}>
        <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-lg text-white">BTP Manager</span>
            <p className="text-xs text-slate-400">Gestion chantiers</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-700 p-2 space-y-1">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Déconnexion' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-white" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-white" />
        )}
      </button>
    </aside>
  )
}
