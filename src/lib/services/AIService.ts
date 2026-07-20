import OpenAI from 'openai'
import { config } from '@/lib/config'
import { AISettingsRepository } from '@/lib/repositories/AISettingsRepository'
import { AIConversationRepository } from '@/lib/repositories/AIConversationRepository'
import { AIAgentService } from '@/lib/services/AIAgentService'
import { logger } from '@/lib/utils/logger'

const settingsRepo = new AISettingsRepository()
const conversationRepo = new AIConversationRepository()

export class AIService {
  private getClient(provider: string, apiKey?: string | null) {
    const key = apiKey || config.openrouter.apiKey
    if (!key) {
      throw new Error('No API key configured. Add one in Settings > AI Configuration or set OPENROUTER_API_KEY in .env.local')
    }
    switch (provider) {
      case 'openrouter':
        return new OpenAI({ apiKey: key, baseURL: config.openrouter.baseURL })
      default:
        return new OpenAI({ apiKey: key, baseURL: config.openrouter.baseURL })
    }
  }

  private isValidProvider(provider: string): boolean {
    return ['openrouter'].includes(provider)
  }

  private buildMessages(history: any[], systemPrompt: string, message: string, settings: any) {
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: any) => ({
        role: m.role,
        content: m.content || '',
        ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}),
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
        ...(m.name ? { name: m.name } : {}),
      })),
      { role: 'user', content: message },
    ]
    return messages
  }

  private async callOpenAICompatible(client: any, messages: any[], tools: any[], settings: any) {
    return client.chat.completions.create({
      model: settings.model || config.ai.defaultModel,
      temperature: settings.temperature ?? config.ai.defaultTemperature,
      max_tokens: settings.maxTokens ?? config.ai.defaultMaxTokens,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
    })
  }

  private async handleFollowUp(client: any, messages: any[], replyMessage: any, toolResults: any[], settings: any) {
    const followUpMessages: any[] = [
      ...messages,
      replyMessage,
      ...toolResults.map((tr: any) => ({
        role: 'tool' as const,
        content: JSON.stringify(tr.result),
        tool_call_id: tr.toolCallId,
        name: tr.name,
      })),
    ]
    return client.chat.completions.create({
      model: settings.model || config.ai.defaultModel,
      temperature: settings.temperature ?? config.ai.defaultTemperature,
      max_tokens: settings.maxTokens ?? config.ai.defaultMaxTokens,
      messages: followUpMessages,
    })
  }

  private async callProvider(provider: string, messages: any[], tools: any[], settings: any) {
    const p = this.isValidProvider(provider) ? provider : config.ai.defaultProvider
    const client = this.getClient(p, settings.apiKey)
    return this.callOpenAICompatible(client, messages, tools, settings)
  }

  private async callFollowUp(provider: string, messages: any[], replyMessage: any, toolResults: any[], settings: any) {
    const client = this.getClient(provider, settings.apiKey)
    return this.handleFollowUp(client, messages, replyMessage, toolResults, settings)
  }

  async chat(userId: string, message: string, sessionId?: string, userName?: string) {
    const sid = sessionId || crypto.randomUUID()
    const settings = await settingsRepo.getSettings(userId)
    if (!settings.enabled) {
      return { reply: 'AI Assistant is currently disabled. Enable it in settings.', sessionId: sid }
    }

    let provider = settings.provider || config.ai.defaultProvider
    if (!this.isValidProvider(provider)) {
      provider = config.ai.defaultProvider
    }
    const history = await conversationRepo.getHistory(userId, sid, 10)

    await conversationRepo.addMessage(userId, sid, { role: 'user', content: message })

    const agent = new AIAgentService(userId)
    const basePrompt = settings.promptTemplate || ''
    const userNameLine = userName ? `\n\nThe current user's name is: ${userName}. Use this name as performedBy when creating projects or logging activities. Do NOT ask for the user's name.` : ''
    const systemPrompt = basePrompt + userNameLine

    const messages = this.buildMessages(history, systemPrompt, message, settings)
    const tools = agent.getToolDefinitions()

    const fallbackModels = [
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "tencent/hy3:free",
      "openai/gpt-oss-20b:free",
    ]

    let modelToUse = settings.model || config.ai.defaultModel

    const tryCall = async (model: string) => {
      const plain = typeof settings.toObject === 'function' ? settings.toObject() : settings
      const trySettings = { ...plain, model }
      return this.callProvider(provider, messages, tools, trySettings)
    }

    let response
    let lastError: any
    const tryModels = [modelToUse, ...fallbackModels.filter(m => m !== modelToUse)]

    for (let i = 0; i < tryModels.length; i++) {
      const m = tryModels[i]
      try {
        response = await tryCall(m)
        if (response?.error) {
          throw new Error(response.error.message || 'Model error')
        }
        if (!response?.choices?.length) {
          throw new Error('Empty response')
        }
        modelToUse = m
        if (m !== settings.model) {
          await settingsRepo.updateSettings(userId, { model: m }).catch(() => {})
        }
        break
      } catch (err: any) {
        lastError = err
        const isRateLimit = err?.status === 429 || err?.error?.code === 429
        if (isRateLimit && i < tryModels.length - 1) {
          await new Promise(r => setTimeout(r, 2000))
        }
      }
    }

    if (!response) {
      const msg = lastError?.error?.message || lastError?.message || 'AI service unavailable'
      throw new Error(msg)
    }

    const choice = response.choices[0]
    const replyMessage = choice.message

    const totalTokens = response.usage?.total_tokens || 0
    settingsRepo.addTokensUsed(userId, totalTokens).catch(() => {})

    if (replyMessage.tool_calls && replyMessage.tool_calls.length > 0) {
      await conversationRepo.addMessage(userId, sid, {
        role: 'assistant',
        content: replyMessage.content || '',
        toolCalls: replyMessage.tool_calls.map((tc: any) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      })

      const toolResults = await agent.executeToolCalls(replyMessage.tool_calls)

      for (const tr of toolResults) {
        await conversationRepo.addMessage(userId, sid, {
          role: 'tool',
          content: JSON.stringify(tr.result),
          toolCallId: tr.toolCallId,
          name: tr.name,
        })
      }

      const followUp = await this.callFollowUp(provider, messages, replyMessage, toolResults, settings)
      const finalReply = followUp.choices[0].message.content || 'Done.'
      await conversationRepo.addMessage(userId, sid, { role: 'assistant', content: finalReply })

      return {
        reply: finalReply,
        sessionId: sid,
        provider,
        model: modelToUse,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens,
        },
      }
    }

    const reply = replyMessage.content || 'I understand. What would you like to do?'
    await conversationRepo.addMessage(userId, sid, { role: 'assistant', content: reply })

    return {
      reply,
      sessionId: sid,
      provider,
      model: modelToUse,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens,
      },
    }
  }
}
