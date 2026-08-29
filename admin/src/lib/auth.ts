import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.JWT_SECRET || 'fallback-dev-secret-key-12345'
const encodedKey = new TextEncoder().encode(secretKey)

export async function signToken(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function verifyToken(session: string | undefined = '') {
  try {
    if (!session) return null
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return null
  }
}

export async function createSession() {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await signToken({ role: 'ADMIN' })
  
  const cookieStore = await cookies()
  cookieStore.set('admin_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function verifySession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')?.value
  const session = await verifyToken(sessionCookie)
  
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
  
  return session
}
