import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import User from '@/models/User';
import Project from '@/models/Project';
import Activity from '@/models/Activity';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const project = await Project.findById(id)
      .populate('assignee')
      .populate('transferHistory.transferredBy', '_id name email image')
      .lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.personTransferHistory?.length) {
      const ids = new Set();
      project.personTransferHistory.forEach(e => { if (e.from) ids.add(e.from.toString()); if (e.to) ids.add(e.to.toString()); });
      if (ids.size) {
        const users = await User.find({ _id: { $in: [...ids] } }).select('_id name email image').lean();
        const map = {};
        users.forEach(u => { map[u._id.toString()] = u; });
        project.personTransferHistory = project.personTransferHistory.map(e => ({
          ...e,
          from: e.from ? (map[e.from.toString()] || e.from) : e.from,
          to: e.to ? (map[e.to.toString()] || e.to) : e.to,
        }));
      }
    } else {
      project.personTransferHistory = [];
    }

    const assigneeId = project.assignee?._id?.toString() || project.assignee?.toString();
    if (
      project.createdBy?.toString() !== session.user.id &&
      assigneeId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    if (
      existingProject.createdBy?.toString() !== session.user.id &&
      existingProject.assignee?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = {};

    const fields = [
      'orderId', 'projectName', 'businessName', 'websiteUrl',
      'websiteUsername', 'cms', 'priority', 'status',
      'assignee', 'startDate', 'tags', 'description', 'price',
      'currentMonth', 'currentYear',
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        if (field === 'price') {
          updates[field] = Number(body[field]);
        } else if (field === 'startDate') {
          updates[field] = new Date(body[field]);
        } else {
          updates[field] = body[field];
        }
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

      await Activity.create({
        project: id,
        type: 'status_change',
        performedBy: session.user.id,
        previousStatus: existingProject.status,
        newStatus: body.status,
        note: body.updateNote || '',
      });
    }

    const monthYearChanged =
      (updates.currentMonth && updates.currentMonth !== existingProject.currentMonth) ||
      (updates.currentYear && updates.currentYear !== existingProject.currentYear) ||
      (body.currentMonth && body.currentMonth !== existingProject.currentMonth) ||
      (body.currentYear && body.currentYear !== existingProject.currentYear);

    const updateOps = { $set: updates };

    if (monthYearChanged) {
      await Activity.create({
        project: id,
        type: 'month_transfer',
        performedBy: session.user.id,
        oldMonth: existingProject.currentMonth,
        newMonth: updates.currentMonth || existingProject.currentMonth,
        newYear: updates.currentYear || existingProject.currentYear,
      });
    }

    await Project.findByIdAndUpdate(id, updateOps, { new: true });

    const updatedProject = await Project.findById(id)
      .populate('assignee')
      .lean();

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

    if (
      project.createdBy?.toString() !== session.user.id &&
      project.assignee?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Promise.all([
      Project.findByIdAndDelete(id),
      Activity.deleteMany({ project: id }),
    ]);

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
