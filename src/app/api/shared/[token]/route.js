import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { decrypt, encrypt } from '@/lib/encryption';
import Share, { cleanupExpiredShares } from '@/models/Share';
import Project from '@/models/Project';
import Activity from '@/models/Activity';
import Note from '@/models/Note';
import User from '@/models/User';

async function validateShare(token) {
  await connectDB();
  const share = await Share.findOne({ token }).lean();
  if (!share) return null;
  if (share.expiresAt && new Date() > new Date(share.expiresAt)) return null;
  return share;
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    await cleanupExpiredShares();

    const { token } = await params;

    const share = await validateShare(token);
    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (share.type !== 'project') {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 400 });
    }

    const project = await Project.findById(share.project)
      .populate('assignee', 'name image')
      .lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const createdBy = await User.findById(project.createdBy).select('name image').lean();

    const activities = await Activity.find({ project: share.project })
      .populate('performedBy', 'name image')
      .populate('fromUser', 'name image')
      .populate('toUser', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    const notes = await Note.find({ project: share.project })
      .populate('createdBy', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    let decryptedPassword = null;
    if (project.websitePassword?.iv && project.websitePassword?.encryptedData) {
      try {
        decryptedPassword = decrypt(project.websitePassword);
      } catch {
        decryptedPassword = null;
      }
    }

    const safeProject = {
      ...project,
      websitePassword: undefined,
      decryptedPassword,
      createdBy: createdBy || null,
    };

    return NextResponse.json({ project: safeProject, activities, notes, accessLevel: share.accessLevel });
  } catch (error) {
    console.error('GET /api/shared/[token] error:', error);
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

    const { token } = await params;
    const share = await validateShare(token);
    if (!share) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    if (share.type !== 'project') {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 400 });
    }

    if (share.accessLevel === 'view') {
      return NextResponse.json({ error: 'View access does not allow editing' }, { status: 403 });
    }

    const body = await request.json();
    const projectId = share.project;

    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updates = {};
    const fields = [
      'orderId', 'projectName', 'websiteUrl',
      'websiteUsername', 'cms', 'priority', 'status',
      'startDate', 'tags', 'description', 'price',
      'currentMonth', 'currentYear', 'assignee',
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
        project: projectId,
        type: 'status_change',
        performedBy: share.createdBy,
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

    if (monthYearChanged) {
      await Activity.create({
        project: projectId,
        type: 'month_transfer',
        performedBy: share.createdBy,
        oldMonth: existingProject.currentMonth,
        newMonth: updates.currentMonth || existingProject.currentMonth,
        newYear: updates.currentYear || existingProject.currentYear,
      });
    }

    const generalFieldKeys = fields.filter(
      f => !['status', 'currentMonth', 'currentYear'].includes(f)
    );
    const hasGeneralChanges = generalFieldKeys.some(key => {
      if (body[key] === undefined) return false;
      const existing = existingProject[key];
      const incoming = body[key];
      if (key === 'startDate') {
        return new Date(incoming).getTime() !== new Date(existing).getTime();
      }
      if (key === 'price') {
        return Number(incoming) !== Number(existing);
      }
      if (key === 'tags') {
        const a = (Array.isArray(incoming) ? incoming : []).sort().join(',');
        const b = (Array.isArray(existing) ? existing : []).sort().join(',');
        return a !== b;
      }
      return String(incoming ?? '') !== String(existing != null ? existing : '');
    });

    if (hasGeneralChanges) {
      await Activity.create({
        project: projectId,
        type: 'project_updated',
        performedBy: share.createdBy,
        description: 'Project details updated via shared link',
      });
    }

    await Project.findByIdAndUpdate(projectId, { $set: updates }, { new: true });

    const updatedProject = await Project.findById(projectId)
      .populate('assignee', 'name image')
      .lean();

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('PATCH /api/shared/[token] error:', error);
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

    const { token } = await params;
    const share = await validateShare(token);
    if (!share) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    if (share.type !== 'project') {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 400 });
    }

    if (share.accessLevel !== 'full') {
      return NextResponse.json({ error: 'Only full access can delete projects' }, { status: 403 });
    }

    const projectId = share.project;

    await Promise.all([
      Project.findByIdAndDelete(projectId),
      Activity.deleteMany({ project: projectId }),
    ]);

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/shared/[token] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
