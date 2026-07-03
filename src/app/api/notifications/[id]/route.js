import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Notification from '@/models/Notification';
import Project from '@/models/Project';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.to.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const project = await Project.findById(notification.project);

    if (body.status === 'accepted') {
      notification.status = 'accepted';
      notification.read = true;

      if (project) {
        project.assignee = session.user.id;
        project.createdBy = session.user.id;
        await project.save();
      }

      await Notification.create({
        type: 'assignee_transfer_accepted',
        title: 'Transfer Accepted',
        from: session.user.id,
        to: notification.from,
        project: notification.project,
        status: 'accepted',
        read: false,
        message: `has accepted the transfer of "${project?.projectName || 'project'}"`,
      });

      await notification.save();

      const updated = await Notification.findById(id)
        .populate('from', '_id name email image')
        .populate('project', '_id orderId projectName')
        .lean();

      return NextResponse.json(updated);
    }

    if (body.status === 'rejected') {
      notification.status = 'rejected';
      notification.read = true;
      await notification.save();

      await Notification.create({
        type: 'assignee_transfer_rejected',
        title: 'Transfer Rejected',
        from: session.user.id,
        to: notification.from,
        project: notification.project,
        status: 'rejected',
        read: false,
        message: `has rejected the transfer of "${project?.projectName || 'project'}"`,
      });

      const updated = await Notification.findById(id)
        .populate('from', '_id name email image')
        .populate('project', '_id orderId projectName')
        .lean();

      return NextResponse.json(updated);
    }

    if (body.read === true || body.read === false) {
      notification.read = body.read;
      await notification.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/notifications/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
