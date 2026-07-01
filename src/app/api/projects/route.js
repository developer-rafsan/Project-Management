import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import Project from '@/models/Project';
import ProjectUpdate from '@/models/ProjectUpdate';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const cms = searchParams.get('cms');
    const tags = searchParams.get('tags');
    const assignee = searchParams.get('assignee');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (month) filter.currentMonth = parseInt(month);
    if (year) filter.currentYear = parseInt(year);
    if (cms) filter.cms = cms;
    if (tags) {
      filter.tags = { $in: tags.split(',').map((t) => t.trim()) };
    }
    if (assignee) filter.assignee = assignee;

    const ownershipFilter = {
      $or: [
        { createdBy: session.user.id },
        { assignee: session.user.id },
      ],
    };

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$and = [
        ownershipFilter,
        {
          $or: [
            { orderId: regex },
            { projectName: regex },
            { businessName: regex },
            { websiteUrl: regex },
          ],
        },
      ];
    } else {
      Object.assign(filter, ownershipFilter);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    const [projects, total] = await Promise.all([
      Project.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Project.countDocuments(filter),
    ]);

    const totalPrice = projects.reduce((sum, p) => sum + (p.price || 0), 0);

    return NextResponse.json({
      projects,
      total,
      totalPrice,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/projects error:', error);
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
    const {
      orderId,
      projectName,
      websiteUrl,
      websiteUsername,
      websitePassword,
      cms,
      priority,
      status,
      businessName,
      assignee,
      startDate,
      tags,
      note,
      description,
      price,
      currentMonth,
      currentYear,
    } = body;

    let generatedOrderId = orderId;

    if (!generatedOrderId) {
      const lastProject = await Project.findOne({ orderId: { $regex: /^NPC-/ } })
        .sort({ orderId: -1 })
        .select('orderId')
        .lean();

      let nextNum = 1;
      if (lastProject && lastProject.orderId) {
        const match = lastProject.orderId.match(/NPC-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      generatedOrderId = `NPC-${String(nextNum).padStart(5, '0')}`;
    }

    let encryptedPassword = {};
    if (websitePassword) {
      encryptedPassword = encrypt(websitePassword);
    }

    const now = new Date();
    const projectData = {
      orderId: generatedOrderId,
      projectName,
      businessName: businessName || '',
      websiteUrl: websiteUrl || '',
      websiteUsername: websiteUsername || '',
      websitePassword: encryptedPassword,
      cms: cms || 'Other',
      priority: priority || 'Medium',
      status: status || 'Pending',
      assignee: assignee || session.user.id,
      startDate: startDate ? new Date(startDate) : new Date(),
      tags: tags || [],
      description: description || '',
      price: price ? Number(price) : 0,
      currentMonth: currentMonth || now.getMonth() + 1,
      currentYear: currentYear || now.getFullYear(),
      createdBy: session.user.id,
    };

    const project = await Project.create(projectData);

    if (status && status !== 'Pending') {
      await ProjectUpdate.create({
        project: project._id,
        previousStatus: 'Pending',
        newStatus: status,
        updatedBy: session.user.id,
        note: note || '',
        month: project.currentMonth,
        year: project.currentYear,
      });
    }

    const populated = await Project.findById(project._id).populate('assignee').lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
