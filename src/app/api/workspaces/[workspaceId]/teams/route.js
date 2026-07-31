import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Workspace from '@/models/Workspace';
import Team from '@/models/Team';
import TeamMembership from '@/models/TeamMembership';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { workspaceId } = await params;
    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    if (workspace.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const teams = await Team.find({ workspace: workspaceId })
      .populate('lead', '_id name email image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('GET /api/workspaces/[workspaceId]/teams error:', error);
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

    const { workspaceId } = await params;
    const body = await request.json();

    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    if (workspace.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const team = await Team.create({
      name: body.name.trim(),
      description: body.description || '',
      workspace: workspaceId,
      lead: session.user.id,
    });

    await TeamMembership.create({
      team: team._id,
      user: session.user.id,
      role: 'lead',
    });

    return NextResponse.json(team.toObject(), { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/[workspaceId]/teams error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
