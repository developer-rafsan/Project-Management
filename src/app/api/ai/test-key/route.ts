import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { config } from '@/lib/config'
import { connectDB } from '@/lib/mongodb'
import { AISettingsRepository } from '@/lib/repositories/AISettingsRepository'
import { logger } from '@/lib/utils/logger'

const authOptions = rawAuthOptions as AuthOptions
const settingsRepo = new AISettingsRepository()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const settings = await settingsRepo.getSettings(session.user.id)
    const apiKey = settings.apiKey || config.openrouter.apiKey

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'No API key found. Add one in Settings > AI Configuration or set OPENROUTER_API_KEY in .env.local' })
    }

    const client = new OpenAI({
      apiKey,
      baseURL: config.openrouter.baseURL,
    })

    const userModel = settings.model || 'qwen/qwen3-coder:free'
    const isPaid = userModel === 'deepseek/deepseek-v4-flash' || userModel === 'qwen/qwen3-235b-a22b'
    const freeModels = ['qwen/qwen3-coder:free', 'openai/gpt-oss-20b:free', 'google/gemini-2.5-flash-lite']
    const testModels = isPaid ? [...freeModels, userModel] : [...new Set([userModel, ...freeModels])]

    let completion
    let lastErr: any
    for (const model of testModels) {
      try {
        completion = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
          max_tokens: 20,
        })
        if (completion?.choices?.length) break
      } catch (e: any) {
        lastErr = e
      }
    }

    if (!completion) {
      const msg = lastErr?.error?.message || lastErr?.message || 'All models failed'
      return NextResponse.json({ success: false, error: msg })
    }

    const content = completion.choices?.[0]?.message?.content || ''
    const success = content.toLowerCase().includes('ok') || content.trim().length > 0

    return NextResponse.json({
      success,
      message: success ? 'API key is valid and working' : 'API key responded but unexpectedly',
      model: completion.model,
      usedKey: apiKey ? apiKey.slice(0, 8) + '...' : 'none',
    })
  } catch (error: any) {
    logger.error('API key test failed', error)
    const errBody = error?.error || error
    const msg = errBody?.message || error?.message || 'Invalid API key or network error'
    const status = errBody?.code || error?.status || 'unknown'
    return NextResponse.json({ success: false, error: msg + (status !== 'unknown' ? ` (code: ${status})` : '') })
  }
}
