import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import ProjectUpdate from '@/models/ProjectUpdate';
import Project from '@/models/Project';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const project = await Project.findById(id).select('createdBy assignee').lean();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (
      project.createdBy?.toString() !== session.user.id &&
      project.assignee?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await ProjectUpdate.find({ project: id })
      .populate('updatedBy', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(updates);
  } catch (error) {
    console.error('GET /api/projects/[id]/updates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
