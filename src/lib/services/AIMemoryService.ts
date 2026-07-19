import OpenAI from 'openai'
import { config } from '@/lib/config'
import { AIMemoryRepository } from '@/lib/repositories/AIMemoryRepository'
import { AIConversationRepository } from '@/lib/repositories/AIConversationRepository'
import { logger } from '@/lib/utils/logger'

const memoryRepo = new AIMemoryRepository()
const conversationRepo = new AIConversationRepository()

const SUMMARY_INTERVAL = 5

export class AIMemoryService {
  private getClient() {
    return new OpenAI({
      apiKey: config.openrouter.apiKey || '',
      baseURL: config.openrouter.baseURL,
    })
  }

  async extractMemories(userId: string, sessionId: string, userMessage: string, assistantReply: string) {
    if (!config.openrouter.apiKey) return

    const extractPrompt = `Extract key facts from this conversation that should be remembered long-term.
Focus on: user preferences, important dates/events, project details, personal facts.
Return ONLY a JSON array of objects with "key" (short label) and "value" (detail).
If nothing to remember, return empty array [].
Do NOT include one-time commands or greetings.

User: ${userMessage}
Assistant: ${assistantReply}`

    try {
      const client = this.getClient()
      const completion = await client.chat.completions.create({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: extractPrompt }],
        max_tokens: 300,
        temperature: 0.1,
      })

      const content = completion.choices?.[0]?.message?.content || '[]'
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const facts = JSON.parse(cleaned)

      if (Array.isArray(facts)) {
        for (const fact of facts) {
          if (fact.key && fact.value) {
            let category = 'general'
            const kl = fact.key.toLowerCase()
            if (kl.includes('prefer') || kl.includes('like') || kl.includes('want')) category = 'preference'
            else if (kl.includes('meeting') || kl.includes('deadline') || kl.includes('date')) category = 'date'
            else if (kl.includes('project')) category = 'project'

            await memoryRepo.setMemory(userId, fact.key.trim(), fact.value.trim(), category, sessionId)
          }
        }
      }
    } catch (err) {
      logger.error('Memory extraction failed', err)
    }
  }

  async buildMemoryContext(userId: string, excludeProject = false): Promise<string> {
    try {
      return await memoryRepo.getMemoryContext(userId, excludeProject ? 'project' : undefined)
    } catch {
      return ''
    }
  }

  async shouldGenerateSummary(userId: string, sessionId: string): Promise<boolean> {
    try {
      const conversation = await conversationRepo.getOrCreateSession(userId, sessionId)
      return (conversation.messageCount || 0) > 0 && (conversation.messageCount || 0) % SUMMARY_INTERVAL === 0
    } catch {
      return false
    }
  }

  async generateAndStoreSummary(userId: string, sessionId: string) {
    if (!config.openrouter.apiKey) return

    try {
      const history = await conversationRepo.getHistory(userId, sessionId, 20)
      if (history.length < 2) return

      const dialogue = history
        .filter((m: any) => m.role !== 'system' && m.role !== 'tool')
        .slice(-10)
        .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')

      const prompt = `Summarize this conversation in 2-3 sentences. Focus on topics discussed, user preferences revealed, and any project-related actions taken. Keep it concise.

Conversation:
${dialogue}

Summary:`

      const client = this.getClient()
      const completion = await client.chat.completions.create({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.2,
      })

      const summary = completion.choices?.[0]?.message?.content?.trim() || ''
      if (summary) {
        await conversationRepo.updateSummary(userId, sessionId, summary)
      }
    } catch (err) {
      logger.error('Summary generation failed', err)
    }
  }

  async buildConversationContext(userId: string, sessionId: string): Promise<string> {
    try {
      const summary = await conversationRepo.getSummary(userId, sessionId)
      if (!summary) return ''
      return `\n\nConversation so far: ${summary}`
    } catch {
      return ''
    }
  }
}
