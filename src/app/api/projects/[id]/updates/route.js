import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import ProjectUpdate from '@/models/ProjectUpdate';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const updates = await ProjectUpdate.find({ project: id })
      .populate('updatedBy', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(updates);
  } catch (error) {
    console.error('GET /api/projects/[id]/updates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
