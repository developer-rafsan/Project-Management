import { BaseRepository } from './BaseRepository'
import AIMemoryModel from '@/models/AIMemory'

export class AIMemoryRepository extends BaseRepository<any> {
  constructor() {
    super(AIMemoryModel)
  }

  async getMemories(userId: string, category?: string) {
    const filter: Record<string, unknown> = { userId }
    if (category) filter.category = category
    return this.model.find(filter).sort({ updatedAt: -1 }).lean()
  }

  async setMemory(userId: string, key: string, value: string, category = 'general', sourceSessionId?: string) {
    return this.model.findOneAndUpdate(
      { userId, key },
      { userId, key, value, category, sourceSessionId, lastAccessed: new Date() },
      { upsert: true, returnDocument: 'after' }
    ).exec()
  }

  async deleteMemory(userId: string, key: string) {
    return this.deleteOne({ userId, key })
  }

  async clearUserMemories(userId: string) {
    return this.model.deleteMany({ userId }).exec()
  }

  async getMemoryContext(userId: string, excludeCategory?: string): Promise<string> {
    const filter: Record<string, unknown> = { userId }
    if (excludeCategory) {
      filter.category = { $ne: excludeCategory }
    }
    const memories = await this.model.find(filter).sort({ updatedAt: -1 }).lean()
    if (!memories.length) return ''
    const lines = memories.map((m: any) => `- ${m.key}: ${m.value}`)
    return `\n\nThings I know about the user:\n${lines.join('\n')}`
  }
}
