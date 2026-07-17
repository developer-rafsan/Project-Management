import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { TelegramRepository } from '@/lib/repositories/TelegramRepository'
import { AISettingsRepository } from '@/lib/repositories/AISettingsRepository'
import { TelegramService } from '@/lib/services/TelegramService'
import { AIService } from '@/lib/services/AIService'
import { sanitizeInput, validateAIMessage } from '@/lib/validators'
import { logger } from '@/lib/utils/logger'
import { config } from '@/lib/config'

const telegramRepo = new TelegramRepository()
const aiSettingsRepo = new AISettingsRepository()
const tsService = new TelegramService()
const aiService = new AIService()

function getBotToken(connection: any): string | undefined {
  return connection?.botToken || undefined
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    if (update.message) {
      const msg = update.message
      const chatId = String(msg.chat.id)
      const text = (msg.text || '').trim()
      const telegramId = String(msg.from.id)
      const username = msg.from.username || msg.from.first_name || ''

      const connection = await telegramRepo.findByTelegramId(telegramId)
      const token = getBotToken(connection)

      if (!text) {
        await tsService.sendMessage(chatId, 'Please send a text message.', 'HTML', token)
        return NextResponse.json({ ok: true })
      }

      if (text === '/start') {
        await tsService.sendMessage(
          chatId,
          `👋 <b>Welcome to ${config.app.name} AI Assistant!</b>\n\n` +
          'I can help you manage your projectsService.\n\n' +
          'First, connect your Telegram account to the platform:\n' +
          '1. Go to Dashboard → AI Assistant Settings\n' +
          '2. Click "Connect Telegram"\n' +
          '3. Send your unique code here\n\n' +
          'Then I can help you:\n' +
          '• Create, update, and manage projects\n' +
          '• Assign team members\n' +
          '• View project summaries\n' +
          '• And much more!',
          'HTML',
          token
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
        await tsService.sendMessage(chatId, helpText, 'HTML', token)
        return NextResponse.json({ ok: true })
      }

      if (!connection) {
        const isCode = /^\d{6,}$/.test(text)
        if (isCode) {
          try {
            const settings = await aiSettingsRepo.findByConnectCode(text)
            if (!settings) {
              await tsService.sendMessage(chatId, '❌ Invalid or expired code. Please generate a new code from the dashboard.', 'HTML', token)
              return NextResponse.json({ ok: true })
            }
            await telegramRepo.connect({
              userId: settings.userId.toString(),
              telegramId,
              username,
              chatId,
            })
            await aiSettingsRepo.clearConnectCode(settings.userId.toString())
            await tsService.sendMessage(
              chatId,
              '✅ <b>Telegram connected successfully!</b>\n\nYou can now manage your projects through Telegram.',
              'HTML',
              token
            )
            return NextResponse.json({ ok: true })
          } catch {
            await tsService.sendMessage(chatId, '❌ Failed to connect. Please try again from the dashboard.', 'HTML', token)
            return NextResponse.json({ ok: true })
          }
        }

        await tsService.sendMessage(
          chatId,
          '⚠️ Your Telegram is not connected.\n\nConnect from Dashboard → AI Assistant Settings, then send the code here.',
          'HTML',
          token
        )
        return NextResponse.json({ ok: true })
      }

      const userToken = getBotToken(connection)
      await tsService.sendChatAction(chatId, 'typing', userToken)

      const validation = validateAIMessage(text)
      if (!validation.valid) {
        await tsService.sendMessage(chatId, `❌ ${validation.error}`, 'HTML', userToken)
        return NextResponse.json({ ok: true })
      }

      const cleanMessage = sanitizeInput(text)

      try {
        const userName = connection.username || 'User'
        const result = await aiService.chat(connection.userId.toString(), cleanMessage, undefined, userName)
        await tsService.sendMessage(chatId, result.reply, 'HTML', userToken)
      } catch (aiError: any) {
        logger.error('AI chat error in Telegram webhook', aiError)
        await tsService.sendMessage(
          chatId,
          '❌ Sorry, I encountered an error. Please try again later.',
          'HTML',
          userToken
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('Telegram webhook error', error)
    return NextResponse.json({ ok: true })
  }
}
