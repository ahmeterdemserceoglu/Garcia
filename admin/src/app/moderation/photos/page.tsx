import prisma from '@/lib/prisma'
import { Check, X, Image as ImageIcon } from 'lucide-react'
import { approvePhoto, rejectPhoto } from './actions'

export const dynamic = 'force-dynamic'

export default async function PendingPhotosPage() {
  const pendingPhotos = await prisma.photos.findMany({
    where: { moderationStatus: 'pending' },
    include: {
      users: {
        include: { profiles: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pending Photos</h1>
        <p className="text-muted-foreground mt-2">
          {pendingPhotos.length} photos waiting for manual moderation.
        </p>
      </div>

      {pendingPhotos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-card">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <ImageIcon className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Queue is Empty</h2>
          <p className="text-muted-foreground max-w-md text-center">
            All photos have been moderated. You're all caught up!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {pendingPhotos.map((photo: any) => (
            <div key={photo.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="relative aspect-[3/4] w-full bg-muted">
                {photo.url.startsWith('data:') ? (
                  <img src={photo.url} alt="Pending" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Invalid URL</div>
                )}
                {photo.isMain && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-bold shadow-sm">
                    MAIN
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="font-bold text-foreground truncate">
                    {photo.users?.profiles?.name || 'Unknown User'}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {photo.users?.email}
                  </p>
                </div>
                
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <form action={rejectPhoto.bind(null, photo.id)}>
                    <button className="w-full py-2 rounded-lg border border-destructive text-destructive font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1 text-sm">
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </form>
                  <form action={approvePhoto.bind(null, photo.id)}>
                    <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 text-sm">
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
