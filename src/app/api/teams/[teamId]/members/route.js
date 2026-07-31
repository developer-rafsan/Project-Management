import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Team from '@/models/Team';
import TeamMembership from '@/models/TeamMembership';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { teamId } = await params;
    const team = await Team.findById(teamId).lean();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const members = await TeamMembership.find({ team: teamId })
      .populate('user', '_id name email image')
      .sort({ joinedAt: -1 })
      .lean();

    return NextResponse.json({ members });
  } catch (error) {
    console.error('GET /api/teams/[teamId]/members error:', error);
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

    const { teamId } = await params;
    const body = await request.json();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.lead?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the team lead can add members' }, { status: 403 });
    }

    if (!body.userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const existing = await TeamMembership.findOne({ team: teamId, user: body.userId });
    if (existing) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 409 });
    }

    const membership = await TeamMembership.create({
      team: teamId,
      user: body.userId,
      role: 'member',
    });

    return NextResponse.json(membership.toObject(), { status: 201 });
  } catch (error) {
    console.error('POST /api/teams/[teamId]/members error:', error);
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

    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.lead?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the team lead can remove members' }, { status: 403 });
    }

    const result = await TeamMembership.deleteOne({ team: teamId, user: userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('DELETE /api/teams/[teamId]/members error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
