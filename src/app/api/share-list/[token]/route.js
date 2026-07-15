import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Share, { cleanupExpiredShares } from '@/models/Share';
import Project from '@/models/Project';
import crypto from 'crypto';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    await cleanupExpiredShares();

    const { token } = await params;

    const share = await Share.findOne({ token }).populate('createdBy', 'name image').lean();
    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (share.type !== 'list') {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 400 });
    }

    const storedCount = share.projects?.length || 0;
    const storedIds = (share.projects || []).map(p => p.toString ? p.toString() : p);

    const query = share.projects?.length
      ? { _id: { $in: share.projects } }
      : {
          $or: [
            { createdBy: share.createdBy._id },
            { 'assignee.user': share.createdBy._id },
          ],
        };

    const projects = await Project.find(query)
      .populate('assignee.user', '_id name email image')
      .sort({ createdAt: -1 })
      .lean();

    const projectIds = projects.map((p) => p._id);
    const existingShares = await Share.find({ type: 'project', project: { $in: projectIds } }).lean();
    const shareMap = {};
    for (const s of existingShares) {
      const expired = s.expiresAt && new Date(s.expiresAt) < new Date();
      if (!expired) {
        shareMap[s.project.toString()] = s.token;
        if (s.accessLevel !== share.accessLevel) {
          await Share.findByIdAndUpdate(s._id, { accessLevel: share.accessLevel || 'view' });
        }
      }
    }

    const safeProjects = [];
    for (const p of projects) {
      let token = shareMap[p._id.toString()];

      if (!token) {
        token = crypto.randomUUID();
        await Share.create({
          type: 'project',
          project: p._id,
          token,
          createdBy: share.createdBy._id,
          expiresAt: null,
          accessLevel: share.accessLevel || 'view',
        });
      }

      safeProjects.push({
        ...p,
        shareToken: token,
      });
    }

    return NextResponse.json({
      projects: safeProjects,
      sharedBy: share.createdBy,
      accessLevel: share.accessLevel,
      projectCount: safeProjects.length,
      isSelectedShare: (share.projects?.length || 0) > 0,
      storedProjectIds: share.projects || [],
      storedProjectCount: share.projects?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/share-list/[token] error:', error);
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

    const { token } = await params;

    const share = await Share.findOne({ token, type: 'list', createdBy: session.user.id });
    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    await Share.findByIdAndDelete(share._id);

    return NextResponse.json({ message: 'Share link revoked' });
  } catch (error) {
    console.error('DELETE /api/share-list/[token] error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
