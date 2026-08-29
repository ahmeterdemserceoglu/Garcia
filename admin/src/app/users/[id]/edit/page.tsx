import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { updateUser } from './actions'

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const user = await prisma.users.findUnique({
    where: { id: params.id },
    include: { profiles: true }
  })

  if (!user) return notFound()

  // Use bind to pass userId to the server action
  const updateUserWithId = updateUser.bind(null, user.id)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/users" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
        <p className="text-muted-foreground mt-1">
          Update profile information, approval status, and account restrictions.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <form action={updateUserWithId} className="divide-y divide-border">
          
          {/* Basic Info Section */}
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <input 
                  type="text" id="name" name="name" 
                  defaultValue={user.profiles?.name || ''}
                  className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <input 
                  type="email" id="email" name="email" 
                  defaultValue={user.email}
                  className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">Bio (Hakkında)</label>
              <textarea 
                id="bio" name="bio" rows={3}
                defaultValue={user.profiles?.bio || ''}
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">City</label>
                <input 
                  type="text" id="city" name="city" 
                  defaultValue={(user.profiles as any)?.city || ''}
                  className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="district" className="text-sm font-medium">District</label>
                <input 
                  type="text" id="district" name="district" 
                  defaultValue={(user.profiles as any)?.district || ''}
                  className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Account Status Section */}
          <div className="p-6 space-y-6 bg-muted/20">
            <h2 className="text-lg font-bold text-foreground mb-4">Account Status & Safety</h2>
            
            <div className="space-y-2">
              <label htmlFor="approvalStatus" className="text-sm font-medium">Verification Status</label>
              <select 
                id="approvalStatus" name="approvalStatus" 
                defaultValue={user.approvalStatus}
                className="w-full max-w-sm bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none"
              >
                <option value="PENDING">Pending (Waiting for review)</option>
                <option value="APPROVED">Approved (Verified user)</option>
                <option value="REJECTED">Rejected (Declined verification)</option>
              </select>
            </div>

            <div className="flex flex-col gap-4 mt-6">
              <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background cursor-pointer hover:bg-muted/50 transition-colors">
                <input 
                  type="checkbox" 
                  name="isActive" 
                  defaultChecked={user.isActive}
                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium">Active Account</div>
                  <div className="text-sm text-muted-foreground">If unchecked, the user cannot log in.</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-destructive/30 rounded-lg bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors">
                <input 
                  type="checkbox" 
                  name="isBanned" 
                  defaultChecked={user.isBanned}
                  className="w-5 h-5 rounded border-destructive text-destructive focus:ring-destructive"
                />
                <div>
                  <div className="font-medium text-destructive">Ban User</div>
                  <div className="text-sm text-destructive/80">If checked, the user is permanently banned from the platform.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="p-6 bg-background flex justify-end gap-3">
            <Link href="/users" className="px-6 py-2.5 rounded-lg border border-border font-medium hover:bg-muted transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
