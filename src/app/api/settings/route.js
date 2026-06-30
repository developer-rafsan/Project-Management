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

    const user = await User.findById(session.user.id).select('monthStartDay').lean();

    return NextResponse.json({
      monthStartDay: user?.monthStartDay ?? 1,
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

    const update = {};
    if (body.monthStartDay !== undefined) {
      const day = Number(body.monthStartDay);
      if (day < 1 || day > 31) {
        return NextResponse.json({ error: 'Month start day must be between 1 and 31' }, { status: 400 });
      }
      update.monthStartDay = day;
    }

    const user = await User.findByIdAndUpdate(session.user.id, update, { new: true }).select('monthStartDay').lean();

    return NextResponse.json({
      monthStartDay: user.monthStartDay,
    });
  } catch (error) {
    console.error('PATCH /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
