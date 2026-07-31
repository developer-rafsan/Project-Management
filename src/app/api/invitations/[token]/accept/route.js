import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Invitation from '@/models/Invitation';
import OrganizationMembership from '@/models/OrganizationMembership';
import User from '@/models/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { token } = await params;

    const invitation = await Invitation.findOne({ token, status: 'pending' });
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    if (invitation.email && invitation.email !== session.user.email) {
      return NextResponse.json({ error: 'This invitation was sent to a different email' }, { status: 403 });
    }

    if (invitation.organization) {
      const existing = await OrganizationMembership.findOne({
        organization: invitation.organization,
        user: session.user.id,
      });
      if (existing) {
        if (existing.status === 'suspended') {
          existing.status = 'active';
          existing.role = invitation.role;
          await existing.save();
        } else {
          return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 409 });
        }
      } else {
        await OrganizationMembership.create({
          organization: invitation.organization,
          user: session.user.id,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          status: 'active',
        });
      }
    }

    invitation.status = 'accepted';
    await invitation.save();

    return NextResponse.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('POST /api/invitations/[token]/accept error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
