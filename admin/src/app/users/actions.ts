'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/auth'

export async function deleteUser(userId: string) {
  try {
    await verifySession()
    // Photos and Profiles typically have ON DELETE CASCADE set up in Prisma if relations are configured correctly.
    // If not, we should delete them manually first.
    // Let's delete profiles and photos first just to be safe.
    await prisma.profiles.deleteMany({ where: { userId } })
    await prisma.photos.deleteMany({ where: { userId } })
    
    // Now delete the user
    await prisma.users.delete({ where: { id: userId } })
    
    revalidatePath('/users')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete user:', error)
    return { success: false, error: 'An error occurred while deleting the user.' }
  }
}
