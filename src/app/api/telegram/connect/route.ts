import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { TelegramRepository } from '@/lib/repositories/TelegramRepository'
import { validateTelegramId } from '@/lib/validators'
import { logger } from '@/lib/utils/logger'

const authOptions = rawAuthOptions as AuthOptions
const telegramRepo = new TelegramRepository()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { telegramId, username, chatId } = body

    if (!telegramId || !validateTelegramId(telegramId)) {
      return NextResponse.json({ error: 'Invalid Telegram ID' }, { status: 400 })
    }
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    await connectDB()

    const connection = await telegramRepo.connect({
      userId: session.user.id,
      telegramId,
      username,
      chatId,
    })

    logger.info(`Telegram connected for user ${session.user.id}`, { telegramId })

    return NextResponse.json({
      success: true,
      message: 'Telegram account connected successfully',
      data: {
        telegramId: connection.telegramId,
        username: connection.username,
        connectedAt: connection.connectedAt,
      },
    })
  } catch (error) {
    logger.error('Telegram connect error', error)
    return NextResponse.json({ error: 'Failed to connect Telegram account' }, { status: 500 })
  }
}
