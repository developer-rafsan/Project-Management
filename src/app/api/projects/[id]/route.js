import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import Project from '@/models/Project';
import ProjectUpdate from '@/models/ProjectUpdate';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const project = await Project.findById(id).populate('assignee').lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updates = {};

    const fields = [
      'orderId', 'projectName', 'businessName', 'websiteUrl',
      'websiteUsername', 'cms', 'priority', 'status',
      'assignee', 'tags', 'description', 'price', 'archived', 'favorite',
      'currentMonth', 'currentYear',
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates[field] = field === 'price' ? Number(body[field]) : body[field];
      }
    }

    if (body.websitePassword) {
      updates.websitePassword = encrypt(body.websitePassword);
    }

    const statusChanged = body.status && body.status !== existingProject.status;

    if (statusChanged) {
      const now = new Date();
      if (!body.currentMonth) updates.currentMonth = now.getMonth() + 1;
      if (!body.currentYear) updates.currentYear = now.getFullYear();

      await ProjectUpdate.create({
        project: id,
        previousStatus: existingProject.status,
        newStatus: body.status,
        updatedBy: session.user.id,
        note: body.updateNote || '',
        month: updates.currentMonth,
        year: updates.currentYear,
      });
    }

    const monthYearChanged =
      (updates.currentMonth && updates.currentMonth !== existingProject.currentMonth) ||
      (updates.currentYear && updates.currentYear !== existingProject.currentYear) ||
      (body.currentMonth && body.currentMonth !== existingProject.currentMonth) ||
      (body.currentYear && body.currentYear !== existingProject.currentYear);

    const updateOps = { $set: updates };

    if (monthYearChanged) {
      const transferEntry = {
        oldMonth: existingProject.currentMonth,
        newMonth: updates.currentMonth || existingProject.currentMonth,
        newYear: updates.currentYear || existingProject.currentYear,
        transferDate: new Date(),
        transferredBy: session.user.id,
      };
      updateOps.$push = { transferHistory: transferEntry };
    }

    await Project.findByIdAndUpdate(id, updateOps, { new: true });

    const updatedProject = await Project.findById(id).populate('assignee').lean();

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('PATCH /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    await Promise.all([
      Project.findByIdAndDelete(id),
      ProjectUpdate.deleteMany({ project: id }),
    ]);

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
