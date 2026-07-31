import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Workspace from '@/models/Workspace';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const workspaces = await Workspace.find({ owner: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('GET /api/workspaces error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, type, settings } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await Workspace.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      slug,
      type: type || 'individual',
      owner: session.user.id,
      settings: {
        defaultRole: 'admin',
        allowInvites: true,
        maxMembers: 10,
        ...(settings || {}),
      },
    });

    return NextResponse.json(workspace.toObject(), { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
