import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { config } from '@/lib/config'
import { logger } from '@/lib/utils/logger'

const authOptions = rawAuthOptions as AuthOptions

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const apiKey = body.apiKey || config.openrouter.apiKey

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'No API key provided. Add one in settings or set OPENROUTER_API_KEY env variable.' })
    }

    const client = new OpenAI({
      apiKey,
      baseURL: config.openrouter.baseURL,
    })

    const completion = await client.chat.completions.create({
      model: 'openrouter/auto',
      messages: [{ role: 'user', content: 'Respond with exactly: ok' }],
      max_tokens: 10,
      temperature: 0,
    })

    const content = completion.choices?.[0]?.message?.content?.toLowerCase().trim() || ''
    const success = content.includes('ok')

    return NextResponse.json({
      success,
      message: success ? 'API key is valid and working' : 'API key responded but unexpectedly',
      model: completion.model,
      usedKey: apiKey.slice(0, 8) + '...',
    })
  } catch (error: any) {
    logger.error('API key test failed', error)
    const errBody = error?.error || error
    const msg = errBody?.message || error?.message || 'Invalid API key or network error'
    const status = errBody?.code || error?.status || ''
    return NextResponse.json({
      success: false,
      error: msg + (status ? ` (code: ${status})` : ''),
    })
  }
}
