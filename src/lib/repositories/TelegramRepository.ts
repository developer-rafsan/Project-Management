import { BaseRepository } from './BaseRepository'
import TelegramConnectionModel from '@/models/TelegramConnection'

interface ITelegramConnection {
  _id?: string
  userId: string
  telegramId: string
  username?: string
  chatId: string
  isConnected: boolean
  connectedAt: Date
  disconnectedAt?: Date
  botToken?: string
  botUsername?: string
}

export class TelegramRepository extends BaseRepository<any> {
  constructor() {
    super(TelegramConnectionModel)
  }

  async findByUserId(userId: string) {
    return this.findOne({ userId, isConnected: true })
  }

  async findByTelegramId(telegramId: string) {
    return this.findOne({ telegramId, isConnected: true })
  }

  async connect(data: {
    userId: string
    telegramId: string
    username?: string
    chatId: string
    botToken?: string
    botUsername?: string
  }): Promise<ITelegramConnection> {
    const existing = await this.findOne({ userId: data.userId })
    if (existing) {
      await this.updateOne(
        { userId: data.userId },
        {
          telegramId: data.telegramId,
          username: data.username,
          chatId: data.chatId,
          isConnected: true,
          disconnectedAt: null,
          connectedAt: new Date(),
          ...(data.botToken ? { botToken: data.botToken } : {}),
          ...(data.botUsername ? { botUsername: data.botUsername } : {}),
        }
      )
      return this.findByUserId(data.userId) as unknown as ITelegramConnection
    }
    return this.create({
      ...data,
      isConnected: true,
      connectedAt: new Date(),
    }) as unknown as ITelegramConnection
  }

  async saveBotConfig(userId: string, botToken: string, botUsername: string) {
    return this.updateOne(
      { userId },
      { botToken, botUsername }
    )
  }

  async getBotConfig(userId: string) {
    const conn = await this.findOne({ userId })
    return {
      botToken: conn?.botToken || null,
      botUsername: conn?.botUsername || null,
    }
  }

  async disconnect(userId: string) {
    return this.updateOne(
      { userId },
      { isConnected: false, disconnectedAt: new Date() }
    )
  }

  async getConnectionStatus(userId: string) {
    const connection = await this.findOne({ userId })
    return {
      isConnected: !!connection?.isConnected,
      telegramUsername: connection?.username || null,
      connectedAt: connection?.connectedAt || null,
      hasBotToken: !!connection?.botToken,
      botUsername: connection?.botUsername || null,
    }
  }
}
