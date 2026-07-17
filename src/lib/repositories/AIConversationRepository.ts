import { BaseRepository } from './BaseRepository'
import AIConversationModel from '@/models/AIConversation'
import { config } from '@/lib/config'

export class AIConversationRepository extends BaseRepository<any> {
  constructor() {
    super(AIConversationModel)
  }

  async getOrCreateSession(userId: string, sessionId: string) {
    let conversation = await this.findOne({ userId, sessionId })
    if (!conversation) {
      conversation = await this.create({
        userId,
        sessionId,
        messages: [],
      })
    }
    return conversation
  }

  async addMessage(
    userId: string,
    sessionId: string,
    message: {
      role: 'user' | 'assistant' | 'system' | 'tool'
      content: string
      toolCalls?: any[]
      toolCallId?: string
      name?: string
    }
  ) {
    const conversation = await this.getOrCreateSession(userId, sessionId)
    conversation.messages.push({
      ...message,
      timestamp: new Date(),
    })
    if (conversation.messages.length > config.ai.maxHistoryLength) {
      conversation.messages = conversation.messages.slice(-config.ai.maxHistoryLength)
    }
    conversation.updatedAt = new Date()
    await conversation.save()
    return conversation
  }

  async getHistory(userId: string, sessionId: string, limit = 20) {
    const conversation = await this.getOrCreateSession(userId, sessionId)
    return conversation.messages.slice(-limit)
  }

  async getUserSessions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const conversations = await this.model
      .find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    const total = await this.count({ userId })
    return { conversations, total, page, totalPages: Math.ceil(total / limit) }
  }

  async clearSession(userId: string, sessionId: string) {
    return this.updateOne(
      { userId, sessionId },
      { messages: [], updatedAt: new Date() }
    )
  }
}
