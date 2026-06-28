import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Note from '@/models/Note';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const notes = await Note.find({ project: id })
      .populate('createdBy', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(notes);
  } catch (error) {
    console.error('GET /api/projects/[id]/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const note = await Note.create({
      project: id,
      content: body.content.trim(),
      createdBy: session.user.id,
    });

    const populated = await Note.findById(note._id)
      .populate('createdBy', 'name image')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
