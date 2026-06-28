import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
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
    const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1;
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();

    const monthFilter = { currentMonth: month, currentYear: year };

    const [
      totalProjects,
      runningProjects,
      completedProjects,
      pendingProjects,
      onHoldProjects,
      statusGrouped,
      priceByStatus,
      recentProjects,
      recentUpdates,
      dailyProgress,
    ] = await Promise.all([
      Project.countDocuments(monthFilter),
      Project.countDocuments({ ...monthFilter, status: 'In Progress' }),
      Project.countDocuments({
        ...monthFilter,
        status: 'Delivered',
      }),
      Project.countDocuments({ ...monthFilter, status: 'Pending' }),
      Project.countDocuments({ ...monthFilter, status: 'On Hold' }),
      Project.aggregate([
        { $match: monthFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: monthFilter },
        { $group: { _id: '$status', total: { $sum: { $ifNull: ['$price', 0] } } } },
      ]),
      Project.find(monthFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      ProjectUpdate.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('project', 'projectName')
        .populate('updatedBy', 'name')
        .lean(),
      Project.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(year, month - 1, 1),
              $lt: new Date(year, month, 1),
            },
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const daysInMonth = new Date(year, month, 0).getDate();

    const chartData = {
      byStatus: statusGrouped,
      monthlyProgress: dailyProgress.map((d) => ({
        day: d._id,
        count: d.count,
      })),
      daysInMonth,
    };

    return NextResponse.json({
      total: totalProjects,
      running: runningProjects,
      completed: completedProjects,
      pending: pendingProjects,
      onHold: onHoldProjects,
      priceByStatus,
      recentProjects,
      recentUpdates,
      chartData,
    });
  } catch (error) {
    console.error('GET /api/projects/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
