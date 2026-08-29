import { ShieldCheck, Flag, Ban, Check } from 'lucide-react'
import prisma from '@/lib/prisma'
import { dismissReport, banReportedUser } from './actions'
import { PhotoGallery } from '@/components/PhotoGallery'

export default async function ReportedProfilesPage() {
  const pendingReports = await prisma.reports.findMany({
    where: { isResolved: false },
    include: {
      users_reports_reportedUserIdTousers: {
        include: { 
          profiles: true,
          photos: { orderBy: { order: 'asc' } }
        }
      },
      users_reports_reporterIdTousers: {
        include: { profiles: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          Reported Profiles
          {pendingReports.length > 0 && (
            <span className="bg-destructive/10 text-destructive text-sm px-3 py-1 rounded-full font-medium">
              {pendingReports.length} pending
            </span>
          )}
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and take action on user profiles reported by the community.
        </p>
      </div>

      {pendingReports.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-card">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Reports Pending</h2>
          <p className="text-muted-foreground max-w-md text-center">
            Great job! The community is safe and there are no profile reports waiting for your review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pendingReports.map((report) => {
            const reportedUser = report.users_reports_reportedUserIdTousers
            const reporter = report.users_reports_reporterIdTousers

            return (
              <div key={report.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 bg-destructive/5 border-b border-border flex items-start gap-3">
                  <Flag className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-bold text-destructive">Reason: {report.reason.replace('_', ' ')}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reported by: <span className="font-medium text-foreground">{reporter.profiles?.name || 'Unknown'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Date: {report.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <PhotoGallery
                  photos={reportedUser.photos.map(p => ({ id: p.id, url: p.url, isMain: p.isMain, order: p.order }))}
                  userName={reportedUser.profiles?.name || 'Unknown'}
                />
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground">
                      {reportedUser.profiles?.name || 'Unknown'}
                    </h3>
                    {reportedUser.profiles?.bio && (
                      <p className="text-sm text-muted-foreground mt-2 italic">"{reportedUser.profiles.bio}"</p>
                    )}
                  </div>
                  
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <form action={banReportedUser.bind(null, report.id, reportedUser.id)}>
                      <button className="w-full py-2.5 rounded-lg border border-destructive text-destructive font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2">
                        <Ban className="w-4 h-4" />
                        Ban User
                      </button>
                    </form>
                    <form action={dismissReport.bind(null, report.id)}>
                      <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Dismiss
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
