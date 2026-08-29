'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { verifySession } from '@/lib/auth'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  city: z.string().optional(),
  district: z.string().optional(),
})

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function createUser(formData: FormData) {
  await verifySession()

  const rawData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    gender: formData.get('gender') as string,
    birthDate: formData.get('birthDate') as string,
    city: formData.get('city') as string,
    district: formData.get('district') as string,
  }

  // Zod validation
  const validatedData = userSchema.parse(rawData)

  const photos = formData.getAll('photos') as File[]

  if (photos.length === 0 || photos[0].size === 0) {
    throw new Error('Please upload at least one photo.')
  }

  const userId = crypto.randomUUID()
  const profileId = crypto.randomUUID()

  // Convert all uploaded photos to Base64 and store directly in DB
  const photoRecords = []
  
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    if (photo.size === 0) continue

    // File validation
    if (photo.size > MAX_FILE_SIZE) {
      throw new Error(`File ${photo.name} is too large. Max size is 5MB.`)
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(photo.type)) {
      throw new Error(`File ${photo.name} has invalid format. Only JPEG, PNG and WEBP are allowed.`)
    }

    const photoId = crypto.randomUUID()
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Convert to Base64 Data URI
    const mimeType = photo.type
    const base64Data = buffer.toString('base64')
    const dataUri = `data:${mimeType};base64,${base64Data}`
    
    photoRecords.push({
      id: photoId,
      url: dataUri,
      key: `admin-upload-${photoId}`,
      isMain: i === 0, // First photo is main
      order: i,
      moderationStatus: 'approved'
    })
  }

  // Gerçek şifre hash'leme işlemi
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(validatedData.password, salt)

  try {
    await prisma.users.create({
      data: {
        id: userId,
        email: validatedData.email,
        passwordHash,
        isFaceVerified: true,
        approvalStatus: 'APPROVED', // Since admin creates it, auto-approve
        updatedAt: new Date(),
        profiles: {
          create: {
            id: profileId,
            name: validatedData.name,
            gender: validatedData.gender,
            birthDate: new Date(validatedData.birthDate),
            city: validatedData.city || '',
            district: validatedData.district || '',
            updatedAt: new Date(),
            showMe: validatedData.gender === 'FEMALE' ? ['MALE'] : ['FEMALE'],
          }
        },
        photos: {
          create: photoRecords
        }
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    throw new Error('Failed to create user. Please try again.')
  }

  revalidatePath('/users')
  revalidatePath('/')
  redirect('/users')
}
