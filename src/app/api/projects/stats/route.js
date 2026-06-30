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
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const from = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = toParam ? new Date(toParam) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    const dateFilter = {
      startDate: { $gte: from, $lte: to },
    };

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
      Project.countDocuments(dateFilter),
      Project.countDocuments({ ...dateFilter, status: 'In Progress' }),
      Project.countDocuments({
        ...dateFilter,
        status: 'Delivered',
      }),
      Project.countDocuments({ ...dateFilter, status: 'Pending' }),
      Project.countDocuments({ ...dateFilter, status: 'On Hold' }),
      Project.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', total: { $sum: { $ifNull: ['$price', 0] } } } },
      ]),
      Project.find(dateFilter)
        .sort({ startDate: -1 })
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
            startDate: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$startDate' },
              month: { $month: '$startDate' },
              day: { $dayOfMonth: '$startDate' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
    ]);

    const chartData = {
      byStatus: statusGrouped,
      monthlyProgress: dailyProgress.map((d) => ({
        year: d._id.year,
        month: d._id.month,
        day: d._id.day,
        count: d.count,
      })),
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
