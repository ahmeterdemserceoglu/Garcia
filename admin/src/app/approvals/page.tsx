import prisma from '@/lib/prisma'
import { Check, X } from 'lucide-react'
import { approveUser, rejectUser } from './actions'
import { PhotoGallery } from '@/components/PhotoGallery'

export const dynamic = 'force-dynamic'

export default async function ApprovalsPage() {
  const pendingUsers = await prisma.users.findMany({
    where: { approvalStatus: 'PENDING' },
    include: { 
      profiles: true,
      photos: { orderBy: { order: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="text-muted-foreground mt-2">
          {pendingUsers.length} users waiting for manual verification.
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
          <div className="text-center">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground">No pending approvals in the queue.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pendingUsers.map((user) => {
            return (
              <div key={user.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                <PhotoGallery
                  photos={user.photos.map(p => ({ id: p.id, url: p.url, isMain: p.isMain, order: p.order }))}
                  userName={user.profiles?.name || 'Unknown'}
                />
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {user.profiles?.name || 'Unknown'} 
                      <span className="text-muted-foreground font-normal">
                        {user.profiles?.birthDate ? new Date().getFullYear() - new Date(user.profiles.birthDate).getFullYear() : ''}
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {user.profiles?.gender?.toLowerCase() || '-'} • {(user.profiles as any)?.city || 'Unknown Location'}
                    </p>
                    {user.profiles?.bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{user.profiles.bio}"</p>
                    )}
                  </div>
                  
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <form action={rejectUser.bind(null, user.id)}>
                      <button className="w-full py-2.5 rounded-lg border border-destructive text-destructive font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </form>
                    <form action={approveUser.bind(null, user.id)}>
                      <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
                

