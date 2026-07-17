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

  async disconnect(userId: string) {
    return this.updateOne(
      { userId },
      { isConnected: false, disconnectedAt: new Date() }
    )
  }

  async getConnectionStatus(userId: string) {
    const connection = await this.findByUserId(userId)
    return {
      isConnected: !!connection,
      telegramUsername: connection?.username || null,
      connectedAt: connection?.connectedAt || null,
    }
  }
}
