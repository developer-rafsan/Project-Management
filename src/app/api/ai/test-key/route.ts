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

    const testModels = [
      settings.model || 'google/gemma-4-31b-it:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'tencent/hy3:free',
      'openai/gpt-oss-20b:free',
    ]

    let completion
    let lastErr: any
    for (let i = 0; i < testModels.length; i++) {
      try {
        completion = await client.chat.completions.create({
          model: testModels[i],
          messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
          max_tokens: 20,
        })
        if (completion?.choices?.length) break
      } catch (e: any) {
        lastErr = e
        if (i < testModels.length - 1) {
          await new Promise(r => setTimeout(r, 2000))
        }
      }
    }

    if (!completion) {
      const msg = lastErr?.error?.message || lastErr?.message || 'All models failed'
      const status = lastErr?.status || lastErr?.error?.code || ''
      return NextResponse.json({ success: false, error: msg + (status ? ` (code: ${status})` : '') })
    }

    const content = completion.choices?.[0]?.message?.content || ''
    const success = content.toLowerCase().includes('ok') || content.trim().length > 0

    return NextResponse.json({
      success: !!success,
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
