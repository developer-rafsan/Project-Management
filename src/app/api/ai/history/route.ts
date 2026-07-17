import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import { authOptions as rawAuthOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { AIConversationRepository } from '@/lib/repositories/AIConversationRepository'
import { validatePagination } from '@/lib/validators'

const authOptions = rawAuthOptions as AuthOptions
const conversationRepo = new AIConversationRepository()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))
    const sessionId = searchParams.get('sessionId')

    const validation = validatePagination(page, limit)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await connectDB()

    if (sessionId) {
      const messages = await conversationRepo.getHistory(session.user.id, sessionId, 50)
      return NextResponse.json({ sessionId, messages })
    }

    const result = await conversationRepo.getUserSessions(session.user.id, page, limit)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get history' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    await connectDB()

    if (sessionId) {
      await conversationRepo.clearSession(session.user.id, sessionId)
      return NextResponse.json({ success: true, message: 'Conversation cleared' })
    }

    await conversationRepo.clearAllSessions(session.user.id)
    return NextResponse.json({ success: true, message: 'All conversations cleared' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 })
  }
}
