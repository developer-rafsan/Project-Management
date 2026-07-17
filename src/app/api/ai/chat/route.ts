import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { AIService } from '@/lib/services/AIService'
import { sanitizeInput, validateAIMessage } from '@/lib/validators'
import { logger } from '@/lib/utils/logger'

const authOptions = rawAuthOptions as AuthOptions
const aiService = new AIService()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, sessionId } = body

    const validation = validateAIMessage(message)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const cleanMessage = sanitizeInput(message)

    await connectDB()

    const result = await aiService.chat(session.user.id, cleanMessage, sessionId)

    logger.info('AI chat completed', { userId: session.user.id, sessionId: result.sessionId })

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('AI chat error', error)
    return NextResponse.json(
      { error: error.message || 'AI service unavailable', detail: error.toString() },
      { status: 500 }
    )
  }
}
