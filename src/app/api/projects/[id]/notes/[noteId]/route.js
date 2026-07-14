import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import ProjectNote from '@/models/ProjectNote';
import Activity from '@/models/Activity';

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

    const note = await ProjectNote.findById(noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    note.content = body.content.trim();
    await note.save();

    const populated = await ProjectNote.findById(note._id)
      .populate('createdBy', 'name image')
      .lean();

    await Activity.create({
      project: note.project,
      type: 'note_updated',
      performedBy: session.user.id,
      description: `Updated a note on the project`,
    });

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

    const note = await ProjectNote.findById(noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Activity.create({
      project: note.project,
      type: 'note_deleted',
      performedBy: session.user.id,
      description: `Deleted a note from the project`,
    });

    await ProjectNote.findByIdAndDelete(noteId);

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/notes/[noteId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
