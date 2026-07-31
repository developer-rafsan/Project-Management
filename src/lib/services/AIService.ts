import OpenAI from 'openai'
import { config } from '@/lib/config'
import { AISettingsRepository } from '@/lib/repositories/AISettingsRepository'
import { AIConversationRepository } from '@/lib/repositories/AIConversationRepository'
import { AIAgentService } from '@/lib/services/AIAgentService'
import { logger } from '@/lib/utils/logger'

const settingsRepo = new AISettingsRepository()
const conversationRepo = new AIConversationRepository()

export class AIService {
  private getClient(apiKey?: string | null) {
    const key = apiKey || config.openrouter.apiKey
    if (!key) {
      throw new Error('No API key configured. Add one in Settings > AI Configuration or set OPENROUTER_API_KEY in .env.local')
    }
    return new OpenAI({ apiKey: key, baseURL: config.openrouter.baseURL })
  }

  private buildMessages(history: any[], systemPrompt: string, message: string) {
    return [
      { role: 'system', content: systemPrompt },
      ...history.map((m: any) => ({
        role: m.role,
        content: m.content,
        ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}),
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
        ...(m.name ? { name: m.name } : {}),
      })),
      { role: 'user', content: message },
    ]
  }

  private async createCompletion(client: any, messages: any[], tools: any[], settings: any) {
    return client.chat.completions.create({
      model: settings.model || config.ai.defaultModel,
      temperature: settings.temperature ?? config.ai.defaultTemperature,
      max_tokens: settings.maxTokens ?? config.ai.defaultMaxTokens,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
    })
  }

  async chat(userId: string, message: string, sessionId?: string, userName?: string, workspaceId?: string) {
    const sid = sessionId || crypto.randomUUID()
    const settings = await settingsRepo.getSettings(userId)
    if (!settings.enabled) {
      return { reply: 'AI Assistant is currently disabled. Enable it in settings.', sessionId: sid }
    }

    const provider = settings.provider === 'openrouter' ? 'openrouter' : config.ai.defaultProvider
    const history = await conversationRepo.getHistory(userId, sid, 10)
    await conversationRepo.addMessage(userId, sid, { role: 'user', content: message })

    const agent = new AIAgentService(userId, workspaceId)
    const basePrompt = settings.promptTemplate || ''
    const userNameLine = userName ? `\n\nThe current user's name is: ${userName}. Use this name as performedBy when creating projects or logging activities. Do NOT ask for the user's name.` : ''
    const systemPrompt = basePrompt + userNameLine

    const messages = this.buildMessages(history, systemPrompt, message)
    const tools = agent.getToolDefinitions()

    const fallbackModels = [
      "qwen/qwen3-coder:free",
      "deepseek/deepseek-v4-flash",
      "google/gemini-2.5-flash-lite",
      "openai/gpt-oss-20b:free",
      "qwen/qwen3-235b-a22b",
    ]

    let modelToUse = settings.model || config.ai.defaultModel
    const tryModels = [...new Set([modelToUse, ...fallbackModels])]
    const client = this.getClient(settings.apiKey)

    let response
    let lastError: any
    for (const m of tryModels) {
      try {
        const trySettings = { ...settings.toObject?.() || settings, model: m }
        response = await this.createCompletion(client, messages, tools, trySettings)
        if (response?.error) throw new Error(response.error.message || 'Model error')
        if (!response?.choices?.length) throw new Error('Empty response')
        modelToUse = m
        break
      } catch (err: any) {
        lastError = err
      }
    }

    if (!response) {
      throw new Error(lastError?.error?.message || lastError?.message || 'AI service unavailable')
    }

    const choice = response.choices[0]
    const replyMessage = choice.message
    const totalTokens = response.usage?.total_tokens || 0
    settingsRepo.addTokensUsed(userId, totalTokens).catch(() => {})

    if (replyMessage.tool_calls?.length) {
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

      const followUpMessages = [
        ...messages,
        replyMessage,
        ...toolResults.map((tr: any) => ({
          role: 'tool' as const,
          content: JSON.stringify(tr.result),
          tool_call_id: tr.toolCallId,
          name: tr.name,
        })),
      ]
      const followUp = await this.createCompletion(client, followUpMessages, [], settings)
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
