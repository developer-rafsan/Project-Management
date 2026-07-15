import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import ProjectNote from '@/models/ProjectNote';
import Project from '@/models/Project';
import Activity from '@/models/Activity';

async function verifyProjectAccess(projectId, userId) {
  const project = await Project.findById(projectId).select('createdBy assignee owner').lean();
  if (!project) return false;
  if (
    project.owner?.toString() !== userId &&
    !project.assignee?.some(a => a.user?.toString() === userId)
  ) return false;
  return true;
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    if (!(await verifyProjectAccess(id, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notes = await ProjectNote.find({ project: id })
      .populate('createdBy', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(notes);
  } catch (error) {
    console.error('GET /api/projects/[id]/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    if (!(await verifyProjectAccess(id, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const note = await ProjectNote.create({
      project: id,
      content: body.content.trim(),
      createdBy: session.user.id,
    });

    const populated = await ProjectNote.findById(note._id)
      .populate('createdBy', 'name image')
      .lean();

    await Activity.create({
      project: id,
      type: 'note_added',
      performedBy: session.user.id,
      description: `Added a note to the project`,
    });

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
