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
      .populate('assignee.user', '_id name email image')
      .populate('owner', '_id name email image')
      .populate('createdBy', '_id name email image')
      .populate('transferMonth.transferredBy', '_id name email image')
      .lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.personTransfer?.length) {
      const ids = new Set();
      project.personTransfer.forEach(e => { if (e.from) ids.add(e.from.toString()); if (e.to) ids.add(e.to.toString()); });
      if (ids.size) {
        const users = await User.find({ _id: { $in: [...ids] } }).select('_id name email image').lean();
        const map = {};
        users.forEach(u => { map[u._id.toString()] = u; });
        project.personTransfer = project.personTransfer.map(e => ({
          ...e,
          from: e.from ? (map[e.from.toString()] || e.from) : e.from,
          to: e.to ? (map[e.to.toString()] || e.to) : e.to,
        }));
      }
    } else {
      project.personTransfer = [];
    }

    if (
      (project.owner?._id || project.owner)?.toString() !== session.user.id &&
      !project.assignee?.some(a => (a.user?._id || a.user)?.toString() === session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error);
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

    const { id } = await params;
    const body = await request.json();

    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isOwner =
      (existingProject.owner?._id || existingProject.owner)?.toString() === session.user.id;

    if (
      !isOwner &&
      !existingProject.assignee?.some(a => (a.user?._id || a.user)?.toString() === session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isOwner) {
      const allowed = ['status'];
      for (const key of Object.keys(body)) {
        if (!allowed.includes(key)) delete body[key];
      }
    }

    const updates = {};

    const fields = [
      'orderId', 'projectName', 'cms', 'priority', 'status',
      'assignee', 'tags', 'description', 'price',
      'progress', 'websites', 'links',
      'currentProjectDate', 'fiverrFeeEnabled',
      'domainHosting',
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
        const existingPwMap = {};
        (existingProject.websites || []).forEach(s => {
          if (s._id && s.password) existingPwMap[s._id.toString()] = s.password;
        });
        updates.websites = updates.websites.map(ws => {
          const obj = { name: ws.name || '', url: ws.url || '', username: ws.username || '' };
          if (ws.password && typeof ws.password === 'string') {
            obj.password = encrypt(ws.password);
          } else if (ws._id && existingPwMap[ws._id]) {
            obj.password = existingPwMap[ws._id];
          }
          return obj;
        });
      }
    }

    if (updates.domainHosting) {
      const existingDhMap = {};
      (existingProject.domainHosting || []).forEach(e => {
        if (e._id) existingDhMap[e._id.toString()] = { password: e.password, hostingPassword: e.hostingPassword };
      });
      updates.domainHosting = updates.domainHosting.map(e => {
        const obj = { ...e };
        if (e.password && typeof e.password === 'string') {
          obj.password = encrypt(e.password);
        } else if (e._id && existingDhMap[e._id]) {
          obj.password = existingDhMap[e._id].password;
        } else {
          delete obj.password;
        }
        if (e.hostingPassword && typeof e.hostingPassword === 'string') {
          obj.hostingPassword = encrypt(e.hostingPassword);
        } else if (e._id && existingDhMap[e._id]) {
          obj.hostingPassword = existingDhMap[e._id].hostingPassword;
        } else {
          delete obj.hostingPassword;
        }
        return obj;
      });
    }

    const statusChanged = body.status && body.status !== existingProject.status;

    if (statusChanged) {
      await Activity.create({
        project: id,
        type: 'status_change',
        performedBy: session.user.id,
        previousStatus: existingProject.status,
        newStatus: body.status,
      });
    }

    const monthYearChanged =
      (updates.currentProjectDate && updates.currentProjectDate !== existingProject.currentProjectDate) ||
      (body.currentProjectDate && body.currentProjectDate !== existingProject.currentProjectDate);

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

    if (body.progress !== undefined && Number(body.progress) !== Number(existingProject.progress)) {
      await Activity.create({
        project: id,
        type: 'progress_updated',
        performedBy: session.user.id,
        previousStatus: String(existingProject.progress),
        newStatus: String(body.progress),
        description: `Progress updated: ${existingProject.progress}% → ${body.progress}%`,
      });
    }

    if (body.price !== undefined && Number(body.price) !== Number(existingProject.price)) {
      await Activity.create({
        project: id,
        type: 'price_updated',
        performedBy: session.user.id,
        description: `Price updated: $${Number(existingProject.price).toFixed(2)} → $${Number(body.price).toFixed(2)}`,
      });
    }

    if (body.websites !== undefined) {
      const oldLen = existingProject.websites?.length || 0;
      const newLen = body.websites?.length || 0;
      if (newLen > oldLen) {
        await Activity.create({
          project: id, type: 'website_added', performedBy: session.user.id,
          description: `Added a new website`,
        });
      } else if (newLen < oldLen) {
        await Activity.create({
          project: id, type: 'website_removed', performedBy: session.user.id,
          description: `Removed a website`,
        });
      } else if (newLen === oldLen && newLen > 0) {
        await Activity.create({
          project: id, type: 'website_updated', performedBy: session.user.id,
          description: `Updated website details`,
        });
      }
    }

    if (body.domainHosting !== undefined) {
      const oldLen = existingProject.domainHosting?.length || 0;
      const newLen = body.domainHosting?.length || 0;
      if (newLen > oldLen) {
        await Activity.create({
          project: id, type: 'domain_added', performedBy: session.user.id,
          description: `Added a new domain/hosting entry`,
        });
      } else if (newLen < oldLen) {
        await Activity.create({
          project: id, type: 'domain_removed', performedBy: session.user.id,
          description: `Removed a domain/hosting entry`,
        });
      } else if (newLen === oldLen && newLen > 0) {
        await Activity.create({
          project: id, type: 'domain_updated', performedBy: session.user.id,
          description: `Updated domain/hosting details`,
        });
      }
    }

    if (body.links !== undefined) {
      await Activity.create({
        project: id, type: 'link_updated', performedBy: session.user.id,
        description: `Updated project links`,
      });
    }

    if (body.tags !== undefined || body.fiverrFeeEnabled !== undefined || body.assignee !== undefined) {
      await Activity.create({
        project: id, type: 'meta_updated', performedBy: session.user.id,
        description: `Updated project metadata`,
      });
    }

    if (hasGeneralChanges || Object.keys(updates).length > 0) {
      existingProject.set(updates);
      await existingProject.save();
    }

    if (monthYearChanged) {
      await Activity.create({
        project: id,
        type: 'month_transfer',
        performedBy: session.user.id,
        description: `Project date changed`,
      });
    }

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
          cms: 'CMS', priority: 'Priority', assignee: 'Assignee',
          tags: 'Tags', description: 'Description', price: 'Price', progress: 'Progress',
          websites: 'Websites', links: 'Links',
          fiverrFeeEnabled: 'Fiverr Fee',
        }[k] || k));

      await Activity.create({
        project: id,
        type: 'project_updated',
        performedBy: session.user.id,
        description: changedLabels.length > 0 ? `Updated: ${changedLabels.join(', ')}` : 'Project details updated',
      });
    }

    const updatedProject = await Project.findById(id)
      .populate('assignee.user', '_id name email image')
      .lean();

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('PATCH /api/projects/[id] error:', error);
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

    const { id } = await params;

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      (project.owner?._id || project.owner)?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const projectName = project.projectName;

    await Promise.all([
      Project.findByIdAndDelete(id),
      Activity.deleteMany({ project: id, type: { $ne: 'project_deleted' } }),
    ]);

    await Activity.create({
      project: id,
      type: 'project_deleted',
      performedBy: session.user.id,
      description: `Deleted project "${projectName}"`,
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
