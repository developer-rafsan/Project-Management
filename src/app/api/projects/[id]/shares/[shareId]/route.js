import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Share from '@/models/Share';
import Project from '@/models/Project';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id, shareId } = await params;

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.createdBy?.toString() !== session.user.id &&
      !project.assignee?.some(a => a.user?.toString() === session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const share = await Share.findOne({ _id: shareId, type: 'project', project: id });
    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    await Share.findByIdAndDelete(shareId);

    return NextResponse.json({ message: 'Share link revoked' });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/shares/[shareId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
