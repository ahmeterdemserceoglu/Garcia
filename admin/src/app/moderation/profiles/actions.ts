'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/auth'

export async function dismissReport(reportId: string) {
  await verifySession()
  await prisma.reports.update({
    where: { id: reportId },
    data: { 
      isResolved: true,
      resolvedAt: new Date()
    }
  })
  revalidatePath('/moderation/profiles')
}

export async function banReportedUser(reportId: string, userId: string) {
  await verifySession()
  // Ban user and resolve report
  await prisma.$transaction([
    prisma.users.update({
      where: { id: userId },
      data: { isBanned: true }
    }),
    prisma.reports.update({
      where: { id: reportId },
      data: { 
        isResolved: true,
        resolvedAt: new Date()
      }
    })
  ])
  
  revalidatePath('/moderation/profiles')
  revalidatePath('/users')
}
