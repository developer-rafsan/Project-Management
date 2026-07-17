import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { TelegramRepository } from '@/lib/repositories/TelegramRepository'
import { TelegramService } from '@/lib/services/TelegramService'
import { config } from '@/lib/config'
import { logger } from '@/lib/utils/logger'

const authOptions = rawAuthOptions as AuthOptions
const telegramRepo = new TelegramRepository()
const telegramService = new TelegramService()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { botToken } = body

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 })
    }

    let botInfo
    try {
      botInfo = await telegramService.getMe(botToken)
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || 'Invalid bot token' },
        { status: 400 }
      )
    }

    await connectDB()

    await telegramRepo.saveBotConfig(
      session.user.id,
      botToken,
      botInfo.username || ''
    )

    const isDev = config.env === 'development' || !config.env

    if (isDev) {
      const webhookUrl = config.telegram.webhookUrl || ''
      if (webhookUrl.startsWith('https://')) {
        const whResult = await telegramService.setWebhook(webhookUrl, botToken)
        return NextResponse.json({
          success: true,
          botUsername: botInfo.username,
          botName: botInfo.first_name,
          webhookSet: whResult.ok,
          webhookUrl,
          message: whResult.ok
            ? 'Bot configured and webhook registered'
            : 'Bot saved but webhook failed: ' + (whResult.description || ''),
        })
      }
      return NextResponse.json({
        success: true,
        botUsername: botInfo.username,
        botName: botInfo.first_name,
        webhookSet: false,
        webhookUrl: '',
        message: 'Bot saved for local testing. To receive live messages, run ngrok and set TELEGRAM_WEBHOOK_URL in .env.local.',
      })
    }

    const webhookUrl = config.telegram.webhookUrl || `${config.app.url}/api/telegram/webhook`
    if (!webhookUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Production requires HTTPS. Set TELEGRAM_WEBHOOK_URL to your HTTPS domain in .env.local' },
        { status: 400 }
      )
    }

    const whResult = await telegramService.setWebhook(webhookUrl, botToken)

    logger.info('Telegram bot saved and webhook set', {
      userId: session.user.id,
      botUsername: botInfo.username,
      webhookSet: whResult.ok,
    })

    return NextResponse.json({
      success: true,
      botUsername: botInfo.username,
      botName: botInfo.first_name,
      webhookSet: whResult.ok,
      webhookUrl,
      message: whResult.ok
        ? 'Bot configured and webhook registered'
        : 'Bot saved but webhook failed: ' + (whResult.description || ''),
    })
  } catch (error: any) {
    logger.error('Telegram save-bot error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save bot config' },
      { status: 500 }
    )
  }
}
