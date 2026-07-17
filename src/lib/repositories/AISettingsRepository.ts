import { BaseRepository } from './BaseRepository'
import AISettingsModel from '@/models/AISettings'
import { config } from '@/lib/config'

export class AISettingsRepository extends BaseRepository<any> {
  constructor() {
    super(AISettingsModel)
  }

  async getSettings(userId: string) {
    let settings = await this.findOne({ userId })
    if (!settings) {
      settings = await this.create({
        userId,
        enabled: true,
        provider: config.ai.defaultProvider,
        model: config.ai.defaultModel,
        temperature: config.ai.defaultTemperature,
        maxTokens: config.ai.defaultMaxTokens,
      })
    }
    return settings
  }

  async updateSettings(userId: string, updates: Record<string, unknown>) {
    return this.updateOne({ userId }, updates)
  }

  async addTokensUsed(userId: string, tokens: number) {
    return this.model.findOneAndUpdate(
      { userId },
      { $inc: { totalTokensUsed: tokens } },
      { returnDocument: 'after' }
    ).exec()
  }
}
