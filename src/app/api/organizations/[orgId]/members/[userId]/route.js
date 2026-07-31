import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Organization from '@/models/Organization';
import OrganizationMembership from '@/models/OrganizationMembership';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { orgId, userId } = await params;
    const body = await request.json();

    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const membership = await OrganizationMembership.findOne({ organization: orgId, user: userId, status: 'active' });
    if (!membership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (body.role) {
      if (!['admin', 'manager', 'member', 'viewer'].includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      membership.role = body.role;
      await membership.save();
    }

    return NextResponse.json(membership.toObject());
  } catch (error) {
    console.error('PATCH /api/organizations/[orgId]/members/[userId] error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { orgId, userId } = await params;

    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const membership = await OrganizationMembership.findOne({ organization: orgId, user: userId, status: 'active' });
    if (!membership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    membership.status = 'suspended';
    await membership.save();

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('DELETE /api/organizations/[orgId]/members/[userId] error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
