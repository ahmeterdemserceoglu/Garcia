'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function approvePhoto(id: string) {
  try {
    await prisma.photos.update({
      where: { id },
      data: { moderationStatus: 'approved' }
    })
    revalidatePath('/moderation/photos')
  } catch (error) {
    console.error('Failed to approve photo:', error)
  }
}

export async function rejectPhoto(id: string) {
  try {
    await prisma.photos.delete({
      where: { id }
    })
    revalidatePath('/moderation/photos')
  } catch (error) {
    console.error('Failed to reject photo:', error)
  }
}
