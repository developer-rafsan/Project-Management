import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Project from '@/models/Project';
import Activity from '@/models/Activity';
import User from '@/models/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const { toUserId } = await request.json();

    if (!toUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the owner can transfer this project' }, { status: 403 });
    }

    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const fromOwner = existingProject.owner?.toString();

    existingProject.owner = toUserId;
    existingProject.personTransfer.push({
      from: fromOwner,
      to: toUserId,
      transferDate: new Date(),
    });
    await existingProject.save();

    await Activity.create({
      project: id,
      type: 'ownership_transfer',
      performedBy: session.user.id,
      fromUser: fromOwner,
      toUser: toUserId,
      description: `Ownership transferred to ${targetUser.name}`,
    });

    const updated = await Project.findById(id)
      .populate('assignee.user', '_id name email image')
      .populate('owner', '_id name email image')
      .lean();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('POST /api/projects/[id]/transfer error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
