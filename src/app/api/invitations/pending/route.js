import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Invitation from '@/models/Invitation';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const invitations = await Invitation.find({
      email: session.user.email,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('organization', 'name slug')
      .populate('workspace', 'name')
      .populate('invitedBy', 'name email image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('GET /api/invitations/pending error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
