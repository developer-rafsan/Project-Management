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
    const project = await Project.findById(id).select('websitePassword additionalWebsites createdBy assignee').lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.createdBy?.toString() !== session.user.id &&
      project.assignee?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let pw = project.websitePassword;

    if (project.additionalWebsites?.length > 0 && project.additionalWebsites[0]?.password?.iv) {
      pw = project.additionalWebsites[0].password;
    }

    if (!pw) {
      return NextResponse.json({ password: '' });
    }

    if (typeof pw === 'string') {
      return NextResponse.json({ password: pw });
    }

    if (pw?.iv && pw?.encryptedData) {
      const password = decrypt(pw);
      return NextResponse.json({ password });
    }

    return NextResponse.json({ password: '' });
  } catch (error) {
    console.error('GET /api/projects/[id]/password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
