import { Wrench, Shield, Globe, Bell, Server } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const settingCards = [
    {
      title: 'General',
      description: 'Global application settings, localization, and brand info.',
      icon: Globe,
      color: 'bg-blue-500/10 text-blue-500',
      href: '#'
    },
    {
      title: 'Maintenance Mode',
      description: 'Take the application offline for updates or critical fixes.',
      icon: Wrench,
      color: 'bg-orange-500/10 text-orange-500',
      href: '/settings/maintenance'
    },
    {
      title: 'Administrators',
      description: 'Manage admin accounts, roles, and permissions.',
      icon: Shield,
      color: 'bg-emerald-500/10 text-emerald-500',
      href: '#'
    },
    {
      title: 'Notifications',
      description: 'Configure push notifications and email templates.',
      icon: Bell,
      color: 'bg-purple-500/10 text-purple-500',
      href: '#'
    },
    {
      title: 'Server Limits',
      description: 'Configure rate limiting, max photo uploads, and free tier limits.',
      icon: Server,
      color: 'bg-rose-500/10 text-rose-500',
      href: '#'
    }
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage application-wide configurations and system tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingCards.map((card) => (
          <Link 
            key={card.title} 
            href={card.href}
            className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
