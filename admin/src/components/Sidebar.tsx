'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, CheckCircle, Settings, 
  ShieldCheck, UserPlus, AlertTriangle, ImageMinus, 
  Activity, DollarSign, Wrench, Shield 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'User Management',
    items: [
      { name: 'All Users', href: '/users', icon: Users },
      { name: 'Add New User', href: '/users/new', icon: UserPlus },
      { name: 'Pending Approvals', href: '/approvals', icon: CheckCircle },
    ]
  },
  {
    title: 'Content & Moderation',
    items: [
      { name: 'Reported Profiles', href: '/moderation/profiles', icon: AlertTriangle },
      { name: 'Pending Photos', href: '/moderation/photos', icon: ImageMinus },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Match Statistics', href: '/analytics/matches', icon: Activity },
      { name: 'Revenue', href: '/analytics/revenue', icon: DollarSign },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'General Settings', href: '/settings', icon: Settings },
      { name: 'Maintenance Mode', href: '/settings/maintenance', icon: Wrench },
      { name: 'Admin Accounts', href: '/settings/admins', icon: Shield },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-72 flex-col bg-card border-r border-border overflow-y-auto">
      <div className="flex items-center gap-3 px-6 py-6 sticky top-0 bg-card z-10 border-b border-border/50">
        <div className="bg-primary/20 p-2 rounded-xl">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">Garcia Admin</span>
      </div>

      <nav className="flex-1 space-y-6 px-4 py-6">
        {navigationGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="p-4 mt-auto sticky bottom-0 bg-card border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/30">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@garcia.app</p>
          </div>
        </div>
      </div>
    </div>
  )
}
