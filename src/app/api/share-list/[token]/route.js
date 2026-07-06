import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import ShareList from '@/models/ShareList';
import Share from '@/models/Share';
import Project from '@/models/Project';
import crypto from 'crypto';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { token } = await params;

    const share = await ShareList.findOne({ token }).populate('createdBy', 'name image').lean();
    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    const storedCount = share.projects?.length || 0;
    const storedIds = (share.projects || []).map(p => p.toString ? p.toString() : p);
    console.log(`[GET /api/share-list/${token}] storedCount=${storedCount}, storedIds=${JSON.stringify(storedIds)}`);

    const query = share.projects?.length
      ? { _id: { $in: share.projects } }
      : {
          $or: [
            { createdBy: share.createdBy._id },
            { assignee: share.createdBy._id },
          ],
        };

    const projects = await Project.find(query)
      .populate('assignee', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    const projectIds = projects.map((p) => p._id);
    const existingShares = await Share.find({ project: { $in: projectIds } }).lean();
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
          project: p._id,
          token,
          createdBy: share.createdBy._id,
          expiresAt: null,
          accessLevel: share.accessLevel || 'view',
        });
      }

      let decryptedPassword = null;
      if (p.websitePassword?.iv && p.websitePassword?.encryptedData) {
        try { decryptedPassword = decrypt(p.websitePassword); } catch { decryptedPassword = null; }
      }

      safeProjects.push({
        ...p,
        websitePassword: undefined,
        decryptedPassword,
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

    const share = await ShareList.findOne({ token, createdBy: session.user.id });
    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    await ShareList.findByIdAndDelete(share._id);

    return NextResponse.json({ message: 'Share link revoked' });
  } catch (error) {
    console.error('DELETE /api/share-list/[token] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
