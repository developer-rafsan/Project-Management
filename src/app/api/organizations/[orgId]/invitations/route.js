import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Organization from '@/models/Organization';
import Invitation from '@/models/Invitation';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { orgId } = await params;
    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invitations = await Invitation.find({ organization: orgId })
      .populate('invitedBy', 'name email image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('GET /api/organizations/[orgId]/invitations error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
