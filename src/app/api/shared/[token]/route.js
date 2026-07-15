import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { decrypt, encrypt } from '@/lib/encryption';
import Share, { cleanupExpiredShares } from '@/models/Share';
import Project from '@/models/Project';
import Activity from '@/models/Activity';
import ProjectNote from '@/models/ProjectNote';
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
      .populate('assignee.user', '_id name email image')
      .populate('owner', '_id name email image')
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

    const notes = await ProjectNote.find({ project: share.project })
      .populate('createdBy', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    let decryptedPassword = null;
    if (project.websites?.length > 0 && project.websites[0]?.password?.iv) {
      try {
        decryptedPassword = decrypt(project.websites[0].password);
      } catch {
        decryptedPassword = null;
      }
    }

    const safeProject = {
      ...project,
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
      'orderId', 'projectName', 'cms', 'priority', 'status',
      'tags', 'description', 'price',
      'currentProjectDate', 'assignee',
      'websites', 'domainHosting',
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        if (field === 'price') {
          updates[field] = Number(body[field]);
        } else if (field === 'currentProjectDate') {
          updates[field] = body[field] ? new Date(body[field]) : undefined;
        } else {
          updates[field] = body[field];
        }
      }
    }

    if (updates.websites) {
      if (Array.isArray(updates.websites) && updates.websites.length === 0) {
        updates.websites = undefined;
      } else {
        updates.websites = updates.websites.map(ws => ({
          ...ws,
          password: ws.password && typeof ws.password === 'string' ? encrypt(ws.password) : (ws.password || {}),
        }));
      }
    }

    if (updates.domainHosting) {
      updates.domainHosting = updates.domainHosting.map(e => ({
        ...e,
        password: e.password && typeof e.password === 'string' ? encrypt(e.password) : (e.password || {}),
        hostingPassword: e.hostingPassword && typeof e.hostingPassword === 'string' ? encrypt(e.hostingPassword) : (e.hostingPassword || {}),
      }));
    }

    const statusChanged = body.status && body.status !== existingProject.status;
    if (statusChanged) {
      if (!body.currentProjectDate) updates.currentProjectDate = new Date();

      await Activity.create({
        project: projectId,
        type: 'status_change',
        performedBy: share.createdBy,
        previousStatus: existingProject.status,
        newStatus: body.status,
      });
    }

    const monthYearChanged =
      (updates.currentProjectDate && updates.currentProjectDate !== existingProject.currentProjectDate) ||
      (body.currentProjectDate && body.currentProjectDate !== existingProject.currentProjectDate);

    if (monthYearChanged) {
      await Activity.create({
        project: projectId,
        type: 'month_transfer',
        performedBy: share.createdBy,
        description: `Project date changed`,
      });
    }

    const generalFieldKeys = fields.filter(
      f => !['status', 'currentProjectDate'].includes(f)
    );
    const hasGeneralChanges = generalFieldKeys.some(key => {
      if (body[key] === undefined) return false;
      const existing = existingProject[key];
      const incoming = body[key];
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
      const changedLabels = generalFieldKeys
        .filter(key => {
          if (body[key] === undefined) return false;
          const existing = existingProject[key];
          const incoming = body[key];
          if (key === 'price') return Number(incoming) !== Number(existing);
          if (key === 'tags') {
            const a = (Array.isArray(incoming) ? incoming : []).sort().join(',');
            const b = (Array.isArray(existing) ? existing : []).sort().join(',');
            return a !== b;
          }
          return String(incoming ?? '') !== String(existing != null ? existing : '');
        })
        .map(k => ({
          orderId: 'Order ID', projectName: 'Name',
          cms: 'CMS', priority: 'Priority', tags: 'Tags',
          description: 'Description', price: 'Price', progress: 'Progress',
          websites: 'Websites', figmaLinks: 'Figma Links', referenceLinks: 'Reference Links',
          fiverrFeeEnabled: 'Fiverr Fee',
        }[k] || k));

      await Activity.create({
        project: projectId,
        type: 'project_updated',
        performedBy: share.createdBy,
        description: changedLabels.length > 0 ? `Updated: ${changedLabels.join(', ')}` : 'Project details updated via shared link',
      });
    }

    if (body.progress !== undefined && Number(body.progress) !== Number(existingProject.progress)) {
      await Activity.create({
        project: projectId,
        type: 'progress_updated',
        performedBy: share.createdBy,
        previousStatus: String(existingProject.progress),
        newStatus: String(body.progress),
        description: `Progress updated: ${existingProject.progress}% → ${body.progress}%`,
      });
    }

    if (body.price !== undefined && Number(body.price) !== Number(existingProject.price)) {
      await Activity.create({
        project: projectId,
        type: 'price_updated',
        performedBy: share.createdBy,
        description: `Price updated: $${Number(existingProject.price).toFixed(2)} → $${Number(body.price).toFixed(2)}`,
      });
    }

    if (body.websites !== undefined) {
      const oldLen = existingProject.websites?.length || 0;
      const newLen = body.websites?.length || 0;
      if (newLen > oldLen) {
        await Activity.create({
          project: projectId, type: 'website_added', performedBy: share.createdBy,
          description: `Added a new website`,
        });
      } else if (newLen < oldLen) {
        await Activity.create({
          project: projectId, type: 'website_removed', performedBy: share.createdBy,
          description: `Removed a website`,
        });
      } else if (newLen === oldLen && newLen > 0) {
        await Activity.create({
          project: projectId, type: 'website_updated', performedBy: share.createdBy,
          description: `Updated website details`,
        });
      }
    }

    if (body.domainHosting !== undefined) {
      const oldLen = existingProject.domainHosting?.length || 0;
      const newLen = body.domainHosting?.length || 0;
      if (newLen > oldLen) {
        await Activity.create({
          project: projectId, type: 'domain_added', performedBy: share.createdBy,
          description: `Added a new domain/hosting entry`,
        });
      } else if (newLen < oldLen) {
        await Activity.create({
          project: projectId, type: 'domain_removed', performedBy: share.createdBy,
          description: `Removed a domain/hosting entry`,
        });
      } else if (newLen === oldLen && newLen > 0) {
        await Activity.create({
          project: projectId, type: 'domain_updated', performedBy: share.createdBy,
          description: `Updated domain/hosting details`,
        });
      }
    }

    if (body.figmaLinks !== undefined || body.referenceLinks !== undefined) {
      await Activity.create({
        project: projectId, type: 'link_updated', performedBy: share.createdBy,
        description: `Updated project links`,
      });
    }

    if (body.tags !== undefined || body.fiverrFeeEnabled !== undefined || body.assignee !== undefined) {
      await Activity.create({
        project: projectId, type: 'meta_updated', performedBy: share.createdBy,
        description: `Updated project metadata`,
      });
    }

    await Project.findByIdAndUpdate(projectId, { $set: updates }, { new: true });

    const updatedProject = await Project.findById(projectId)
      .populate('assignee.user', '_id name email image')
      .populate('owner', '_id name email image')
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
