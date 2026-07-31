import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Workspace from '@/models/Workspace';

const USER_SETTINGS = ['viewMode', 'monthStartDay', 'fiverrFeeEnabled'];

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (workspaceId) {
      const workspace = await Workspace.findById(workspaceId).lean();
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      if (workspace.owner?.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({
        viewMode: workspace.settings?.viewMode || 'list',
        monthStartDay: workspace.settings?.monthStartDay || 1,
        fiverrFeeEnabled: workspace.settings?.fiverrFeeEnabled !== false,
      });
    }

    const user = await User.findById(session.user.id).select('viewMode monthStartDay fiverrFeeEnabled').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      viewMode: user.viewMode || 'list',
      monthStartDay: user.monthStartDay || 1,
      fiverrFeeEnabled: user.fiverrFeeEnabled !== false,
    });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const updates = {};

    for (const key of USER_SETTINGS) {
      if (body[key] === undefined) continue;
      if (key === 'viewMode') {
        if (!['list', 'grid'].includes(body[key])) {
          return NextResponse.json({ error: 'Invalid viewMode' }, { status: 400 });
        }
      }
      if (key === 'monthStartDay') {
        const day = Number(body[key]);
        if (day < 1 || day > 28) {
          return NextResponse.json({ error: 'monthStartDay must be between 1 and 28' }, { status: 400 });
        }
        updates[key] = day;
        continue;
      }
      if (key === 'fiverrFeeEnabled') {
        updates[key] = Boolean(body[key]);
        continue;
      }
      updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    if (workspaceId) {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      if (workspace.owner?.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      Object.assign(workspace.settings, updates);
      await workspace.save();
      return NextResponse.json({
        viewMode: workspace.settings.viewMode,
        monthStartDay: workspace.settings.monthStartDay,
        fiverrFeeEnabled: workspace.settings.fiverrFeeEnabled !== false,
      });
    }

    const user = await User.findByIdAndUpdate(session.user.id, updates, { new: true })
      .select('viewMode monthStartDay fiverrFeeEnabled')
      .lean();

    return NextResponse.json({
      viewMode: user.viewMode,
      monthStartDay: user.monthStartDay,
      fiverrFeeEnabled: user.fiverrFeeEnabled !== false,
    });
  } catch (error) {
    console.error('PATCH /api/settings error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
