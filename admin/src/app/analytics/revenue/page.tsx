import { DollarSign, CreditCard, Gem } from 'lucide-react'
import prisma from '@/lib/prisma'

export default async function RevenueStatisticsPage() {
  const premiumUsers = await prisma.users.count({ where: { isPremium: true } })

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track subscription conversions, in-app purchases, and overall revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</p>
            <p className="text-2xl font-bold">$0.00</p>
          </div>
        </div>
        
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <Gem className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Premium Subscribers</p>
            <p className="text-2xl font-bold">{premiumUsers}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <CreditCard className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Average Revenue Per User</p>
            <p className="text-2xl font-bold">$0.00</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-8 h-8 text-emerald-500/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Awaiting Financial Integration</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Connect Stripe or Apple/Google Play billing in the settings to view live revenue charts.
          </p>
        </div>
      </div>
    </div>
  )
}
