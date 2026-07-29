import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { TelegramRepository } from '@/lib/repositories/TelegramRepository'
import { AISettingsRepository } from '@/lib/repositories/AISettingsRepository'
import { TelegramService } from '@/lib/services/TelegramService'
import { AIService } from '@/lib/services/AIService'
import { sanitizeInput, validateAIMessage } from '@/lib/validators'
import { logger } from '@/lib/utils/logger'

const telegramRepo = new TelegramRepository()
const aiSettingsRepo = new AISettingsRepository()
const tsService = new TelegramService()
const aiService = new AIService()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  try {
    const segments = (await params).slug || []
    const botOwnerId = segments[0]

    if (!botOwnerId) {
      return NextResponse.json({ ok: false, error: 'Missing bot owner ID' }, { status: 400 })
    }

    let botToken: string | undefined
    let botUsername: string | undefined
    const ownerConn = await telegramRepo.getBotConfig(botOwnerId)
    if (ownerConn?.botToken) {
      botToken = ownerConn.botToken
      botUsername = ownerConn.botUsername || undefined
    }

    if (!botToken) {
      logger.warn('Webhook received but no bot token found for owner', { botOwnerId })
      return NextResponse.json({ ok: true })
    }

    const update = await request.json()

    if (update.message) {
      const msg = update.message
      const chatId = String(msg.chat.id)
      const text = (msg.text || '').trim()
      const telegramId = String(msg.from.id)
      const username = msg.from.username || msg.from.first_name || ''

      const connection = await telegramRepo.findByUserId(botOwnerId)

      if (!text) {
        await tsService.sendMessage(chatId, 'Please send a text message.', 'HTML', botToken)
        return NextResponse.json({ ok: true })
      }

      if (text === '/start') {
        await tsService.sendMessage(
          chatId,
          `👋 <b>Welcome to Project Manager AI Assistant!</b>\n\n` +
          'I can help you manage your projects.\n\n' +
          '<b>First time here?</b>\n' +
          '1. Go to Dashboard → AI Assistant → Channels\n' +
          '2. Open Telegram settings and get your connect code\n' +
          '3. Send that code here to link your account\n\n' +
          'Already connected? Just tell me what to do!\n' +
          '• "Show me all my projects"\n' +
          '• "Create a project called Nano ERP"\n' +
          '• "Update project status to Delivered"\n' +
          '• "Show project summary"',
          'HTML',
          botToken
        )
        return NextResponse.json({ ok: true })
      }

      if (text === '/help') {
        const helpText =
          '<b>🤖 AI Assistant Commands</b>\n\n' +
          'Just talk to me naturally! Examples:\n\n' +
          '📋 <b>Projects:</b>\n' +
          '• "Show all my projects"\n' +
          '• "Create a project called Nano ERP"\n' +
          '• "Update Project X status to Delivered"\n' +
          '• "Delete Project X"\n\n' +
          '👥 <b>Team:</b>\n' +
          '• "Assign Rahim to Project X"\n\n' +
          '📊 <b>Reports:</b>\n' +
          '• "Give me a project summary"\n' +
          '• "Show project status breakdown"'
        await tsService.sendMessage(chatId, helpText, 'HTML', botToken)
        return NextResponse.json({ ok: true })
      }

      if (!connection || !connection.isConnected) {
        const isCode = /^\d{6,}$/.test(text)
        if (isCode) {
          try {
            const settings = await aiSettingsRepo.findByConnectCode(text)
            if (!settings) {
              await tsService.sendMessage(chatId, '❌ Invalid or expired code. Please generate a new code from the dashboard.', 'HTML', botToken)
              return NextResponse.json({ ok: true })
            }
            await telegramRepo.connect({
              userId: settings.userId.toString(),
              telegramId,
              username,
              chatId,
              botToken,
              botUsername,
            })
            await aiSettingsRepo.clearConnectCode(settings.userId.toString())
            await tsService.sendMessage(
              chatId,
              '✅ <b>Telegram connected successfully!</b>\n\nYou can now manage your projects through Telegram.',
              'HTML',
              botToken
            )
            return NextResponse.json({ ok: true })
          } catch {
            await tsService.sendMessage(chatId, '❌ Failed to connect. Please try again from the dashboard.', 'HTML', botToken)
            return NextResponse.json({ ok: true })
          }
        }

        await tsService.sendMessage(
          chatId,
          '⚠️ Your Telegram is not connected.\n\nConnect from Dashboard → AI Assistant → Channels → Telegram, then send the code here.',
          'HTML',
          botToken
        )
        return NextResponse.json({ ok: true })
      }

      await tsService.sendChatAction(chatId, 'typing', botToken)

      const validation = validateAIMessage(text)
      if (!validation.valid) {
        await tsService.sendMessage(chatId, `❌ ${validation.error}`, 'HTML', botToken)
        return NextResponse.json({ ok: true })
      }

      const cleanMessage = sanitizeInput(text)

      try {
        const userName = connection.username || 'User'
        const telegramSessionId = `telegram-${telegramId}`
        const result = await aiService.chat(connection.userId.toString(), cleanMessage, telegramSessionId, userName)
        await tsService.sendMessage(chatId, result.reply, 'HTML', botToken)
      } catch (aiError: any) {
        logger.error('AI chat error in Telegram webhook', aiError)
        await tsService.sendMessage(
          chatId,
          '❌ Sorry, I encountered an error. Please try again later.',
          'HTML',
          botToken
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('Telegram webhook error', error)
    return NextResponse.json({ ok: true })
  }
}
