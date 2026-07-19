import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { TelegramRepository } from '@/lib/repositories/TelegramRepository'

const authOptions = rawAuthOptions as AuthOptions
const telegramRepo = new TelegramRepository()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const status = await telegramRepo.getConnectionStatus(session.user.id)

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({ isConnected: false, error: 'Failed to get status' }, { status: 500 })
  }
}
