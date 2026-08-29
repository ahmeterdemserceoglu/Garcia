import prisma from '@/lib/prisma'
import { MoreHorizontal, Plus, Pencil } from 'lucide-react'
import { DeleteUserButton } from './DeleteUserButton'

import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const users = await prisma.users.findMany({
    include: { profiles: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <Link href="/users/new" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-5 h-5" />
          Add User
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Gender</th>
                <th className="px-6 py-4 font-medium">Joined At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold uppercase">
                        {user.profiles?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.profiles?.name || 'No Profile'}</div>
                        <div className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.approvalStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                      user.approvalStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {user.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground capitalize">
                    {user.profiles?.gender?.toLowerCase() || '-'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/users/${user.id}/edit`}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                        title="Edit User"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteUserButton userId={user.id} userName={user.profiles?.name || 'Unknown User'} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
