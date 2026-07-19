import { NextResponse } from 'next/server'
import { TelegramService } from '@/lib/services/TelegramService'
import { config } from '@/lib/config'
import { logger } from '@/lib/utils/logger'

const telegramService = new TelegramService()

export async function POST() {
  try {
    const webhookUrl = config.telegram.webhookUrl
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'TELEGRAM_WEBHOOK_URL is not set in .env.local' },
        { status: 400 }
      )
    }

    const result = await telegramService.setWebhook(webhookUrl)

    if (result.ok) {
      logger.info('Telegram webhook set successfully', { webhookUrl })
      return NextResponse.json({
        success: true,
        message: 'Webhook set successfully',
        webhookUrl,
      })
    }

    return NextResponse.json(
      { error: result.description || 'Failed to set webhook' },
      { status: 500 }
    )
  } catch (error: any) {
    logger.error('Telegram webhook setup error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set webhook' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const webhookUrl = config.telegram.webhookUrl
    return NextResponse.json({
      webhookUrl,
      configured: !!webhookUrl,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
