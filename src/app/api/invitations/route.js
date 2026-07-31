import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Invitation from '@/models/Invitation';
import Organization from '@/models/Organization';
import { randomUUID } from 'crypto';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { email, organization: orgId, role } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'organization is required' }, { status: 400 });
    }

    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = randomUUID();

    const invitation = await Invitation.create({
      email,
      organization: orgId,
      invitedBy: session.user.id,
      role: role || 'member',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return NextResponse.json(invitation.toObject(), { status: 201 });
  } catch (error) {
    console.error('POST /api/invitations error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
