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
    const team = await Team.findById(teamId)
      .populate('lead', '_id name email image')
      .lean();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('GET /api/teams/[teamId] error:', error);
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

    const { teamId } = await params;
    const body = await request.json();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.lead?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the team lead can update this team' }, { status: 403 });
    }

    if (body.name) team.name = body.name;
    if (body.description !== undefined) team.description = body.description;

    await team.save();

    return NextResponse.json(team.toObject());
  } catch (error) {
    console.error('PATCH /api/teams/[teamId] error:', error);
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

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.lead?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the team lead can delete this team' }, { status: 403 });
    }

    await TeamMembership.deleteMany({ team: teamId });
    await Team.findByIdAndDelete(teamId);

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/teams/[teamId] error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
