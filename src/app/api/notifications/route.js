import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Notification from '@/models/Notification';
import Project from '@/models/Project';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project');
    const type = searchParams.get('type');
    const sent = searchParams.get('sent');

    let filter = {};
    if (sent) {
      filter = { from: session.user.id, ...(type ? { type } : {}), ...(projectId ? { project: projectId } : {}) };
    } else if (projectId) {
      filter = { project: projectId, from: session.user.id, ...(type ? { type } : {}) };
    } else {
      filter = { to: session.user.id };
    }

    const notifications = await Notification.find(filter)
      .populate('from', '_id name email image')
      .populate('to', '_id name email image')
      .populate('project', '_id orderId projectName')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
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
    const { to: toUserId, project: projectId, message, type, percentage } = body;

    if (!toUserId || !projectId) {
      return NextResponse.json({ error: 'Missing required fields: to, project' }, { status: 400 });
    }

    const notifType = type || 'assignee_transfer_request';
    if (!['assignee_transfer_request', 'assignee_add_request', 'assignee_remove_request', 'assignee_update_request', 'owner_transfer_request'].includes(notifType)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.owner?.toString() !== session.user.id &&
      project.createdBy?.toString() !== session.user.id &&
      !project.assignee?.some(a => a.user?.toString() === session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notificationData = {
      type: notifType,
      title: notifType === 'assignee_add_request' ? 'Assignee Request' : notifType === 'assignee_remove_request' ? 'Remove Request' : notifType === 'assignee_update_request' ? 'Update Request' : notifType === 'owner_transfer_request' ? 'Owner Transfer Request' : 'Transfer Request',
      from: session.user.id,
      to: toUserId,
      project: projectId,
      message: message || '',
    };

    if ((notifType === 'assignee_add_request' || notifType === 'assignee_update_request') && percentage != null) {
      if (percentage < 0 || percentage > 100) {
        return NextResponse.json({ error: 'Percentage must be between 0 and 100' }, { status: 400 });
      }
      notificationData.percentage = percentage;
    }

    const notification = await Notification.create(notificationData);

    const populated = await Notification.findById(notification._id)
      .populate('from', '_id name email image')
      .populate('to', '_id name email image')
      .populate('project', '_id orderId projectName')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
