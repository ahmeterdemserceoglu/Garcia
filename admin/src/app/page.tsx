import prisma from '@/lib/prisma'
import { Users, Heart, Image as ImageIcon, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [totalUsers, totalMatches, pendingPhotos, pendingUsers] = await Promise.all([
    prisma.users.count(),
    prisma.matches.count(),
    prisma.photos.count({ where: { moderationStatus: 'pending' } }),
    prisma.users.count({ where: { approvalStatus: 'PENDING' } })
  ])

  const stats = [
    { name: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-500' },
    { name: 'Total Matches', value: totalMatches, icon: Heart, color: 'text-rose-500' },
    { name: 'Pending Photos', value: pendingPhotos, icon: ImageIcon, color: 'text-amber-500' },
    { name: 'Pending Approvals', value: pendingUsers, icon: AlertTriangle, color: 'text-orange-500' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
