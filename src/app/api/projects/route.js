import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import { getMonthRange } from '@/lib/dateUtils';
import Project from '@/models/Project';
import Activity from '@/models/Activity';

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
    const monthStartDay = parseInt(searchParams.get('monthStartDay')) || 1;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (month && year) {
      const { from, to } = getMonthRange(parseInt(year), parseInt(month), monthStartDay)
      filter.currentProjectDate = { $gte: from, $lte: to }
    }
    if (cms) filter.cms = cms;
    if (tags) {
      filter.tags = { $in: tags.split(',').map((t) => t.trim()) };
    }
    if (assignee) filter.assignee = assignee;

    const ownershipFilter = {
      $or: [
        { owner: session.user.id },
        { 'assignee.user': session.user.id },
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
            { 'websites.url': regex },
          ],
        },
      ];
    } else {
      Object.assign(filter, ownershipFilter);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .select('orderId projectName status priority cms price progress websites links createdAt currentProjectDate assignee tags createdBy owner fiverrFeeEnabled')
        .sort(sort).skip(skip).limit(limit).lean(),
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
    const {
      orderId,
      projectName,
      cms,
      priority,
      status,
      assignee,
      tags,
      note,
      description,
      price,
      progress,
      websites,
      links,
      currentProjectDate,
      fiverrFeeEnabled,
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

    if (generatedOrderId && !body.confirmDuplicateOrderId) {
      const existingCount = await Project.countDocuments({ orderId: generatedOrderId });
      if (existingCount > 0) {
        return NextResponse.json({
          duplicateWarning: true,
          count: existingCount,
          orderId: generatedOrderId,
          message: `This Order ID already has ${existingCount} project(s). Do you want to create another project with the same Order ID?`,
        }, { status: 409 });
      }
    }

    const now = new Date();
    let projectData = {
      orderId: generatedOrderId,
      projectName,
      cms: cms || 'Other',
      priority: priority || 'Medium',
      status: status || 'Pending',
      assignee: Array.isArray(assignee) ? assignee : [],
      tags: tags || [],
      description: description || '',
      price: price ? Number(price) : 0,
      progress: progress !== undefined ? Number(progress) : 0,
      websites: (websites || []).map(ws => {
        const obj = { ...ws };
        if (ws.password && typeof ws.password === 'string') {
          obj.password = encrypt(ws.password);
        } else if (ws.password && typeof ws.password === 'object') {
          obj.password = ws.password;
        } else {
          obj.password = {};
        }
        return obj;
      }),
      links: links || [],
      currentProjectDate: currentProjectDate ? new Date(currentProjectDate) : new Date(),
      createdBy: session.user.id,
      owner: session.user.id,
      fiverrFeeEnabled: fiverrFeeEnabled !== undefined ? fiverrFeeEnabled : true,
    };

    const project = await Project.create(projectData);

    await Activity.create({
      project: project._id,
      type: 'project_created',
      performedBy: session.user.id,
      newStatus: status || 'Pending',
      note: note || '',
      description: `Project created with status "${status || 'Pending'}"`,
    });

    if (status && status !== 'Pending') {
      await Activity.create({
        project: project._id,
        type: 'status_change',
        performedBy: session.user.id,
        previousStatus: 'Pending',
        newStatus: status,
        note: note || '',
      });
    }

    const populated = await Project.findById(project._id).populate('assignee.user', '_id name email image').lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' }, { status: 500 });
  }
}
