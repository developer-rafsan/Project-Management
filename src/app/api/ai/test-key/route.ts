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
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    const client = new OpenAI({
      apiKey,
      baseURL: config.openrouter.baseURL,
    })

    const completion = await client.chat.completions.create({
      model: 'deepseek/deepseek-v4-flash',
      messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
      max_tokens: 10,
    })

    const success = completion.choices?.[0]?.message?.content?.includes('ok')

    return NextResponse.json({
      success: !!success,
      message: success ? 'API key is valid and working' : 'API key responded but unexpectedly',
      model: completion.model,
    })
  } catch (error: any) {
    logger.error('API key test failed', error)
    const msg = error?.error?.message || error?.message || 'Invalid API key or network error'
    return NextResponse.json({ success: false, error: msg }, { status: 200 })
  }
}
