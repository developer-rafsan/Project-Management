import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Project from '@/models/Project';
import Share, { cleanupExpiredShares } from '@/models/Share';
import crypto from 'node:crypto';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.createdBy?.toString() !== session.user.id &&
      project.assignee?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = crypto.randomUUID();

    let expiresAt = null;
    if (body.expiresIn === '1h') {
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    } else if (body.expiresIn === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (body.expiresIn === 'custom' && body.customDate) {
      expiresAt = new Date(body.customDate);
    }

    const accessLevel = body.accessLevel || 'view';

    const share = await Share.create({
      type: 'project',
      project: id,
      token,
      createdBy: session.user.id,
      expiresAt,
      accessLevel,
    });

    const url = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/shared/${token}`;

    return NextResponse.json({ _id: share._id, token, url, expiresAt, accessLevel });
  } catch (error) {
    console.error('POST /api/projects/[id]/shares error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.createdBy?.toString() !== session.user.id &&
      project.assignee?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await cleanupExpiredShares();

    const shares = await Share.find({ type: 'project', project: id })
      .populate('createdBy', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(shares);
  } catch (error) {
    console.error('GET /api/projects/[id]/shares error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
