import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { config } from '@/lib/config'
import { connectDB } from '@/lib/mongodb'
import { AISettingsRepository } from '@/lib/repositories/AISettingsRepository'
import { logger } from '@/lib/utils/logger'

const authOptions = rawAuthOptions as AuthOptions
const settingsRepo = new AISettingsRepository()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { description } = await request.json()
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    await connectDB()
    const settings = await settingsRepo.getSettings(session.user.id)
    const apiKey = settings.apiKey || config.openrouter.apiKey

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    }

    const client = new OpenAI({ apiKey, baseURL: config.openrouter.baseURL })

    const completion = await client.chat.completions.create({
      model: settings.model || 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: 'You are a prompt engineering expert. Generate a concise, effective system prompt for an AI assistant based on the user\'s description. Return ONLY the prompt text, no explanations, no markdown formatting, no quotes.',
        },
        {
          role: 'user',
          content: `Create a system prompt for an AI assistant that: ${description}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const prompt = completion.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({ prompt })
  } catch (error: any) {
    logger.error('Failed to generate prompt', error)
    return NextResponse.json({ error: error?.message || 'Failed to generate prompt' }, { status: 500 })
  }
}
