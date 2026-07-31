import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Organization from '@/models/Organization';
import Workspace from '@/models/Workspace';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const organizations = await Organization.find({ owner: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('GET /api/organizations error:', error);
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
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await Organization.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const org = await Organization.create({
      name: name.trim(),
      slug,
      description: description || '',
      owner: session.user.id,
    });

    await Workspace.create({
      name: `${name.trim()} Workspace`,
      slug: `${slug}-workspace`,
      type: 'organization',
      owner: session.user.id,
      organization: org._id,
    });

    return NextResponse.json(org.toObject(), { status: 201 });
  } catch (error) {
    console.error('POST /api/organizations error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
