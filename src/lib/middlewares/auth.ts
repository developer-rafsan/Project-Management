import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'

const authOptions = rawAuthOptions as AuthOptions

export interface AuthenticatedRequest {
  userId: string
  userEmail?: string
  userName?: string
}

export async function getAuthenticatedUser(): Promise<AuthenticatedRequest | NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return {
    userId: session.user.id,
    userEmail: session.user.email || undefined,
    userName: session.user.name || undefined,
  }
}

export async function requireAuth() {
  const result = await getAuthenticatedUser()
  if (result instanceof NextResponse) throw new Error('Unauthorized')
  return result
}
