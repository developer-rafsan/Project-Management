import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Share, { cleanupExpiredShares } from '@/models/Share';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    await cleanupExpiredShares();

    const shares = await Share.find({ type: 'list', createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const result = shares.map((s) => ({
      _id: s._id,
      token: s.token,
      url: `${baseUrl}/shared-list/${s.token}`,
      expiresAt: s.expiresAt,
      accessLevel: s.accessLevel || 'view',
      createdAt: s.createdAt,
      active: !s.expiresAt || new Date(s.expiresAt) > new Date(),
      projectCount: s.projects?.length || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/share-list error:', error);
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

    const token = crypto.randomUUID();

    let expiresAt = null;
    if (body.expiresIn === '1h') {
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    } else if (body.expiresIn === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (body.expiresIn === 'custom' && body.customDate) {
      expiresAt = new Date(body.customDate);
    }

    const accessLevel = body.accessLevel || 'view';

    const shareData = {
      type: 'list',
      token,
      createdBy: session.user.id,
      expiresAt,
      accessLevel,
    };
    if (body.projectIds?.length) {
      shareData.projects = body.projectIds;
    }

    const share = await Share.create(shareData);

    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const url = `${baseUrl}/shared-list/${token}`;

    const savedCount = share.projects?.length || 0;
    return NextResponse.json({ _id: share._id, token, url, expiresAt, accessLevel, projectCount: savedCount, requestedCount: body.projectIds?.length || 0 });
  } catch (error) {
    console.error('POST /api/share-list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
