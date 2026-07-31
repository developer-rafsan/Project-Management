import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Organization from '@/models/Organization';
import OrganizationMembership from '@/models/OrganizationMembership';

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

    const members = await OrganizationMembership.find({ organization: orgId, status: 'active' })
      .populate('user', '_id name email image')
      .sort({ joinedAt: -1 })
      .lean();

    return NextResponse.json({ members });
  } catch (error) {
    console.error('GET /api/organizations/[orgId]/members error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { orgId } = await params;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await OrganizationMembership.findOne({ organization: orgId, user: userId });
    if (existing) {
      if (existing.status === 'suspended') {
        existing.status = 'active';
        existing.role = role || 'member';
        await existing.save();
        return NextResponse.json(existing.toObject());
      }
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    const membership = await OrganizationMembership.create({
      organization: orgId,
      user: userId,
      role: role || 'member',
      invitedBy: session.user.id,
      status: 'active',
    });

    return NextResponse.json(membership.toObject(), { status: 201 });
  } catch (error) {
    console.error('POST /api/organizations/[orgId]/members error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
