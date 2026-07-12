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
    const project = await Project.findById(id).select('domainHosting createdBy assignee').lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.createdBy?.toString() !== session.user.id &&
      project.assignee?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const decryptPw = (pw) => {
      if (!pw || typeof pw !== 'object') return '';
      if (typeof pw === 'string') return pw;
      if (pw?.iv && pw?.encryptedData) {
        try { return decrypt(pw); } catch { return ''; }
      }
      return '';
    };

    const domainHostingPasswords = (project.domainHosting || []).map((e, idx) => ({
      index: idx,
      password: decryptPw(e.password),
      hostingPassword: decryptPw(e.hostingPassword),
    }));

    return NextResponse.json({ domainHostingPasswords });
  } catch (error) {
    console.error('GET /api/projects/[id]/domain-password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
