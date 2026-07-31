import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Organization from '@/models/Organization';
import Workspace from '@/models/Workspace';

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

    return NextResponse.json(org);
  } catch (error) {
    console.error('GET /api/organizations/[orgId] error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { orgId } = await params;
    const body = await request.json();

    const org = await Organization.findById(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (body.name) org.name = body.name;
    if (body.description !== undefined) org.description = body.description;
    if (body.logo !== undefined) org.logo = body.logo;
    if (body.settings) Object.assign(org.settings, body.settings);

    await org.save();

    return NextResponse.json(org.toObject());
  } catch (error) {
    console.error('PATCH /api/organizations/[orgId] error:', error);
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

    const { orgId } = await params;

    const org = await Organization.findById(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Workspace.deleteMany({ organization: orgId });
    await Organization.findByIdAndDelete(orgId);

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/organizations/[orgId] error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
