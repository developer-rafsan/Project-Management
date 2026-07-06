import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Share from '@/models/Share';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('share_token');

    if (shareToken) {
      await connectDB();
      const share = await Share.findOne({ token: shareToken }).lean();
      if (!share || (share.expiresAt && new Date() > new Date(share.expiresAt))) {
        return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 403 });
      }
      const users = await User.find({}, '_id name email image').lean();
      return NextResponse.json(users);
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const users = await User.find({}, '_id name email image').lean();

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
