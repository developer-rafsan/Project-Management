import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const updates = {};

    if (body.viewMode !== undefined) {
      if (!['list', 'grid'].includes(body.viewMode)) {
        return NextResponse.json({ error: 'Invalid viewMode' }, { status: 400 });
      }
      updates.viewMode = body.viewMode;
    }

    if (body.monthStartDay !== undefined) {
      const day = Number(body.monthStartDay);
      if (day < 1 || day > 28) {
        return NextResponse.json({ error: 'monthStartDay must be between 1 and 28' }, { status: 400 });
      }
      updates.monthStartDay = day;
    }

    if (body.fiverrFeeEnabled !== undefined) {
      updates.fiverrFeeEnabled = Boolean(body.fiverrFeeEnabled);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
