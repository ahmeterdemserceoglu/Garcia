'use server'

import { createSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is not set')
  }

  // Remove potential quotes or whitespace from both sides just in case
  const cleanPassword = password.trim().replace(/^"|"$/g, '')
  const cleanAdmin = adminPassword.trim().replace(/^"|"$/g, '')

  if (cleanPassword === cleanAdmin) {
    await createSession()
    redirect('/')
  } else {
    return { error: 'Invalid password' }
  }
}
