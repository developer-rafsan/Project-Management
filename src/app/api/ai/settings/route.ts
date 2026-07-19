import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { AISettingsRepository } from '@/lib/repositories/AISettingsRepository'

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

    const envKey = process.env.OPENROUTER_API_KEY || ''

    return NextResponse.json({
      enabled: settings.enabled,
      provider: settings.provider || 'openai',
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      systemPrompt: settings.systemPrompt || settings.promptTemplate || '',
      promptTemplate: settings.promptTemplate,
      totalTokensUsed: settings.totalTokensUsed || 0,
      totalTokensLimit: settings.totalTokensLimit || 7000000,
      apiKey: settings.apiKey || envKey || '',
      hasApiKey: !!settings.apiKey || !!envKey,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const allowed = ['enabled', 'provider', 'model', 'temperature', 'maxTokens', 'systemPrompt', 'promptTemplate', 'apiKey']
    const updates: Record<string, unknown> = {}

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key]
      }
    }

    if (body.systemPrompt !== undefined) {
      updates.promptTemplate = body.systemPrompt
    }
    delete updates.systemPrompt

    await connectDB()
    await settingsRepo.updateSettings(session.user.id, updates)

    return NextResponse.json({ success: true, ...updates })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
