import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Invitation from '@/models/Invitation';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { token } = await params;

    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.invitedBy?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the inviter can cancel this invitation' }, { status: 403 });
    }

    invitation.status = 'cancelled';
    await invitation.save();

    return NextResponse.json({ message: 'Invitation cancelled' });
  } catch (error) {
    console.error('DELETE /api/invitations/[token] error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
