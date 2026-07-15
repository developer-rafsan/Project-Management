import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Notification from '@/models/Notification';
import Project from '@/models/Project';
import Activity from '@/models/Activity';

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
        if (notification.type === 'assignee_add_request') {
          const pct = notification.percentage || 0;
          const existing = project.assignee || [];
          const alreadyAssigned = existing.some(
            a => (a.user?.toString ? a.user.toString() : a.user) === session.user.id
          );
          if (!alreadyAssigned) {
            const currentTotal = existing.reduce((s, a) => s + (a.percentage || 0), 0);
            if (currentTotal + pct > 100) {
              return NextResponse.json({ error: `Accepting this would exceed 100% total share (${currentTotal}% + ${pct}% > 100%)` }, { status: 400 });
            }
            project.assignee = [...existing, { user: session.user.id, percentage: pct }];
          }
        } else if (notification.type === 'assignee_remove_request') {
          project.assignee = (project.assignee || []).filter(
            a => (a.user?.toString ? a.user.toString() : a.user) !== session.user.id
          );
        } else if (notification.type === 'owner_transfer_request') {
          project.owner = session.user.id;
          const existing = project.assignee || [];
          const alreadyAssigned = existing.some(
            a => (a.user?.toString ? a.user.toString() : a.user) === session.user.id
          );
          if (!alreadyAssigned) {
            project.assignee = [...existing, { user: session.user.id, percentage: 0 }];
          }
        } else {
          project.assignee = [{ user: session.user.id, percentage: 100 }];
          project.createdBy = session.user.id;
          if (!project.personTransfer) {
            project.personTransfer = [];
          }
          project.personTransfer.push({
            from: notification.from,
            to: session.user.id,
            transferDate: new Date(),
          });
        }
        await project.save();

        const desc = notification.type === 'assignee_add_request'
          ? `Added as assignee with ${notification.percentage || 0}% share`
          : notification.type === 'assignee_remove_request'
            ? `Removed from assignees`
            : notification.type === 'owner_transfer_request'
              ? `Ownership transferred to ${session.user.name || 'new owner'}`
              : `Transferred to ${session.user.name || 'new assignee'}`;

        await Activity.create({
          project: notification.project,
          type: 'person_transfer',
          performedBy: notification.from,
          fromUser: notification.from,
          toUser: session.user.id,
          description: desc,
        });
      }

      const responseType = notification.type === 'assignee_add_request' ? 'assignee_add_accepted'
        : notification.type === 'assignee_remove_request' ? 'assignee_remove_accepted'
        : notification.type === 'owner_transfer_request' ? 'owner_transfer_accepted'
        : 'assignee_transfer_accepted';
      const responseTitle = notification.type === 'assignee_add_request' ? 'Assignee Request Accepted'
        : notification.type === 'assignee_remove_request' ? 'Remove Request Accepted'
        : notification.type === 'owner_transfer_request' ? 'Owner Transfer Accepted'
        : 'Transfer Accepted';
      const responseMsg = notification.type === 'assignee_add_request'
        ? `has accepted the assignee request for "${project?.projectName || 'project'}"`
        : notification.type === 'assignee_remove_request'
          ? `has accepted removal from "${project?.projectName || 'project'}"`
          : notification.type === 'owner_transfer_request'
            ? `has accepted ownership of "${project?.projectName || 'project'}"`
            : `has accepted the transfer of "${project?.projectName || 'project'}"`;

      await Notification.create({
        type: responseType,
        title: responseTitle,
        from: session.user.id,
        to: notification.from,
        project: notification.project,
        status: 'accepted',
        read: false,
        message: responseMsg,
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

      const responseType = notification.type === 'assignee_add_request' ? 'assignee_add_rejected'
        : notification.type === 'assignee_remove_request' ? 'assignee_remove_rejected'
        : notification.type === 'owner_transfer_request' ? 'owner_transfer_rejected'
        : 'assignee_transfer_rejected';
      const responseTitle = notification.type === 'assignee_add_request' ? 'Assignee Request Rejected'
        : notification.type === 'assignee_remove_request' ? 'Remove Request Rejected'
        : notification.type === 'owner_transfer_request' ? 'Owner Transfer Rejected'
        : 'Transfer Rejected';
      const responseMsg = notification.type === 'assignee_add_request'
        ? `has rejected the assignee request for "${project?.projectName || 'project'}"`
        : notification.type === 'assignee_remove_request'
          ? `has rejected removal from "${project?.projectName || 'project'}"`
          : notification.type === 'owner_transfer_request'
            ? `has rejected ownership of "${project?.projectName || 'project'}"`
            : `has rejected the transfer of "${project?.projectName || 'project'}"`;

      await Notification.create({
        type: responseType,
        title: responseTitle,
        from: session.user.id,
        to: notification.from,
        project: notification.project,
        status: 'rejected',
        read: false,
        message: responseMsg,
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

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.from.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Notification.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notifications/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
