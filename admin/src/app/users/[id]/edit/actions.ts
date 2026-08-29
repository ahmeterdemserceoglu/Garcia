'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import { z } from 'zod'

const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
})

export async function updateUser(userId: string, formData: FormData) {
  await verifySession()
  
  const rawData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    bio: formData.get('bio') as string,
    city: formData.get('city') as string,
    district: formData.get('district') as string,
  }

  // Zod validation
  const validatedData = editUserSchema.parse(rawData)
  
  const approvalStatus = formData.get('approvalStatus') as 'PENDING' | 'APPROVED' | 'REJECTED'
  const isActive = formData.get('isActive') === 'on'
  const isBanned = formData.get('isBanned') === 'on'

  try {
    await prisma.users.update({
      where: { id: userId },
      data: {
        email: validatedData.email,
        approvalStatus,
        isActive,
        isBanned,
        profiles: {
          update: {
            name: validatedData.name,
            bio: validatedData.bio,
            city: validatedData.city,
            district: validatedData.district,
          }
        }
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    throw new Error('Failed to update user. Please try again.')
  }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}/edit`)
  redirect('/users')
}
