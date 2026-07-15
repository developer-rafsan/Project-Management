import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Activity from '@/models/Activity';
import Project from '@/models/Project';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const project = await Project.findById(id).select('owner assignee').lean();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (
      project.owner?.toString() !== session.user.id &&
      !project.assignee?.some(a => a.user?.toString() === session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activities = await Activity.find({ project: id })
      .populate('performedBy', 'name image')
      .populate('fromUser', 'name image')
      .populate('toUser', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(activities);
  } catch (error) {
    console.error('GET /api/projects/[id]/updates error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
