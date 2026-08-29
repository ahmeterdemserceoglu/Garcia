'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/auth'

export async function approveUser(userId: string) {
  await verifySession()
  await prisma.users.update({
    where: { id: userId },
    data: { 
      approvalStatus: 'APPROVED',
      isFaceVerified: true
    }
  })
  revalidatePath('/approvals')
  revalidatePath('/users')
  revalidatePath('/')
}

export async function rejectUser(userId: string) {
  await verifySession()
  await prisma.users.update({
    where: { id: userId },
    data: { 
      approvalStatus: 'REJECTED',
      isFaceVerified: false
    }
  })
  revalidatePath('/approvals')
  revalidatePath('/users')
  revalidatePath('/')
}
