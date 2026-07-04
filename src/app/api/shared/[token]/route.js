import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { decrypt } from '@/lib/encryption';
import Share from '@/models/Share';
import Project from '@/models/Project';
import Activity from '@/models/Activity';
import Note from '@/models/Note';
import User from '@/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { token } = await params;

    const share = await Share.findOne({ token });
    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
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

    return NextResponse.json({ project: safeProject, activities, notes });
  } catch (error) {
    console.error('GET /api/shared/[token] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
