import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Note from '@/models/Note';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { noteId } = await params;
    const body = await request.json();

    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    note.content = body.content.trim();
    await note.save();

    const populated = await Note.findById(note._id)
      .populate('createdBy', 'name image')
      .lean();

    return NextResponse.json(populated);
  } catch (error) {
    console.error('PATCH /api/projects/[id]/notes/[noteId] error:', error);
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

    const { noteId } = await params;

    const note = await Note.findById(noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Note.findByIdAndDelete(noteId);

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/notes/[noteId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
