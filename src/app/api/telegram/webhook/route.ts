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
const telegramService = new TelegramService()
const aiService = new AIService()

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    if (update.message) {
      const msg = update.message
      const chatId = String(msg.chat.id)
      const text = (msg.text || '').trim()
      const telegramId = String(msg.from.id)
      const username = msg.from.username || msg.from.first_name || ''

      if (!text) {
        await telegramService.sendMessage(chatId, 'Please send a text message.')
        return NextResponse.json({ ok: true })
      }

      if (text === '/start') {
        await telegramService.sendMessage(
          chatId,
          `👋 <b>Welcome to ${config.app.name} AI Assistant!</b>\n\n` +
          'I can help you manage your projects.\n\n' +
          'First, connect your Telegram account to the platform:\n' +
          '1. Go to Dashboard → AI Assistant Settings\n' +
          '2. Click "Connect Telegram"\n' +
          '3. Send your unique code here\n\n' +
          'Then I can help you:\n' +
          '• Create, update, and manage projects\n' +
          '• Assign team members\n' +
          '• View project summaries\n' +
          '• And much more!'
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
        await telegramService.sendMessage(chatId, helpText)
        return NextResponse.json({ ok: true })
      }

      const connection = await telegramRepo.findByTelegramId(telegramId)
      if (!connection) {
        const isCode = /^\d{6,}$/.test(text)
        if (isCode) {
          try {
            const settings = await aiSettingsRepo.findByConnectCode(text)
            if (!settings) {
              await telegramService.sendMessage(chatId, '❌ Invalid or expired code. Please generate a new code from the dashboard.')
              return NextResponse.json({ ok: true })
            }
            await telegramRepo.connect({
              userId: settings.userId.toString(),
              telegramId,
              username,
              chatId,
            })
            await aiSettingsRepo.clearConnectCode(settings.userId.toString())
            await telegramService.sendMessage(
              chatId,
              '✅ <b>Telegram connected successfully!</b>\n\nYou can now manage your projects through Telegram.'
            )
            return NextResponse.json({ ok: true })
          } catch {
            await telegramService.sendMessage(chatId, '❌ Failed to connect. Please try again from the dashboard.')
            return NextResponse.json({ ok: true })
          }
        }

        await telegramService.sendMessage(
          chatId,
          '⚠️ Your Telegram is not connected.\n\nConnect from Dashboard → AI Assistant Settings, then send the code here.'
        )
        return NextResponse.json({ ok: true })
      }

      await telegramService.sendChatAction(chatId)

      const validation = validateAIMessage(text)
      if (!validation.valid) {
        await telegramService.sendMessage(chatId, `❌ ${validation.error}`)
        return NextResponse.json({ ok: true })
      }

      const cleanMessage = sanitizeInput(text)

      try {
        const result = await aiService.chat(connection.userId.toString(), cleanMessage)
        await telegramService.sendMessage(chatId, result.reply)
      } catch (aiError: any) {
        logger.error('AI chat error in Telegram webhook', aiError)
        await telegramService.sendMessage(
          chatId,
          '❌ Sorry, I encountered an error. Please try again later.'
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('Telegram webhook error', error)
    return NextResponse.json({ ok: true })
  }
}
