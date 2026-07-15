import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import Project from '@/models/Project';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const project = await Project.findById(id).select('websites createdBy assignee owner').lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.owner?.toString() !== session.user.id &&
      !project.assignee?.some(a => a.user?.toString() === session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const passwords = (project.websites || []).map((site, idx) => {
      const pw = site.password;
      if (!pw || typeof pw !== 'object') return { index: idx, password: '' };

      if (typeof pw === 'string') return { index: idx, password: pw };

      if (pw?.iv && pw?.encryptedData) {
        try {
          return { index: idx, password: decrypt(pw) };
        } catch {
          return { index: idx, password: '' };
        }
      }

      return { index: idx, password: '' };
    });

    return NextResponse.json({ passwords });
  } catch (error) {
    console.error('GET /api/projects/[id]/additional-passwords error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
