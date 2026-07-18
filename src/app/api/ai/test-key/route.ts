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
      return NextResponse.json({ success: false, error: 'No API key found. Add one in settings or set OPENROUTER_API_KEY env variable.' })
    }

    const client = new OpenAI({
      apiKey,
      baseURL: config.openrouter.baseURL,
    })

    const completion = await client.chat.completions.create({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
      max_tokens: 10,
    })

    const success = completion.choices?.[0]?.message?.content?.includes('ok')

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
