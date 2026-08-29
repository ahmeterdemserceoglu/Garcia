import { Activity, Heart, TrendingUp } from 'lucide-react'
import prisma from '@/lib/prisma'

export default async function MatchStatisticsPage() {
  const [totalMatches, todayLikes, activeChats] = await Promise.all([
    prisma.matches.count(),
    prisma.likes.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    prisma.matches.count({ where: { isActive: true } }),
  ])

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Match Statistics</h1>
        <p className="text-muted-foreground mt-2">
          Monitor user engagement, swipe behavior, and match success rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-lg">
            <Heart className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
            <p className="text-2xl font-bold">{totalMatches}</p>
          </div>
        </div>
        
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Swipes Today</p>
            <p className="text-2xl font-bold">{todayLikes}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Chats</p>
            <p className="text-2xl font-bold">{activeChats}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-64 h-48 bg-muted rounded-xl flex items-end justify-center gap-2 p-4 mx-auto mb-6">
            <div className="w-8 bg-primary/20 h-[30%] rounded-t-md"></div>
            <div className="w-8 bg-primary/40 h-[50%] rounded-t-md"></div>
            <div className="w-8 bg-primary/60 h-[70%] rounded-t-md"></div>
            <div className="w-8 bg-primary/80 h-[40%] rounded-t-md"></div>
            <div className="w-8 bg-primary h-[90%] rounded-t-md"></div>
            <div className="w-8 bg-primary/70 h-[60%] rounded-t-md"></div>
          </div>
          <h3 className="text-lg font-medium text-foreground">Weekly Match Trend</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Detailed chart visualization will be available in the next analytics update.
          </p>
        </div>
      </div>
    </div>
  )
}
