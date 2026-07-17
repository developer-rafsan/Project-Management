import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { TelegramRepository } from '@/lib/repositories/TelegramRepository'
import { logger } from '@/lib/utils/logger'

const authOptions = rawAuthOptions as AuthOptions
const telegramRepo = new TelegramRepository()

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    await telegramRepo.disconnect(session.user.id)

    logger.info(`Telegram disconnected for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Telegram account disconnected successfully',
    })
  } catch (error) {
    logger.error('Telegram disconnect error', error)
    return NextResponse.json({ error: 'Failed to disconnect Telegram account' }, { status: 500 })
  }
}
