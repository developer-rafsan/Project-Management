import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { AISettingsRepository } from '@/lib/repositories/AISettingsRepository'
import { logger } from '@/lib/utils/logger'

const authOptions = rawAuthOptions as AuthOptions
const aiSettingsRepo = new AISettingsRepository()

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const settings = await aiSettingsRepo.getSettings(session.user.id)

    let code = settings?.telegramConnectCode

    if (!code) {
      code = generateCode()
      await aiSettingsRepo.setConnectCode(session.user.id, code)
      logger.info(`Generated connect code for user ${session.user.id}`)
    }

    return NextResponse.json({ code })
  } catch (error) {
    logger.error('Telegram code error', error)
    return NextResponse.json({ error: 'Failed to get code' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const code = generateCode()
    await aiSettingsRepo.setConnectCode(session.user.id, code)
    logger.info(`Regenerated connect code for user ${session.user.id}`)

    return NextResponse.json({ code })
  } catch (error) {
    logger.error('Telegram code regeneration error', error)
    return NextResponse.json({ error: 'Failed to regenerate code' }, { status: 500 })
  }
}
