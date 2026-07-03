import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Notification from '@/models/Notification';
import Project from '@/models/Project';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const notifications = await Notification.find({ to: session.user.id })
      .populate('from', '_id name email image')
      .populate('project', '_id orderId projectName')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { to: toUserId, project: projectId, message } = body;

    if (!toUserId || !projectId) {
      return NextResponse.json({ error: 'Missing required fields: to, project' }, { status: 400 });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.createdBy?.toString() !== session.user.id &&
      project.assignee?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notification = await Notification.create({
      type: 'assignee_transfer_request',
      title: 'Transfer Request',
      from: session.user.id,
      to: toUserId,
      project: projectId,
      message: message || '',
    });

    const populated = await Notification.findById(notification._id)
      .populate('from', '_id name email image')
      .populate('project', '_id orderId projectName')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
