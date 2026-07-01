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
    const allParam = searchParams.get('all');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const dateFilter = {};
    if (allParam !== 'true') {
      const fromDate = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const toDate = toParam ? new Date(toParam) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
      if (fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear()) {
        dateFilter.currentMonth = fromDate.getMonth() + 1;
        dateFilter.currentYear = fromDate.getFullYear();
      } else {
        const months = [];
        let d = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
        while (d <= toDate) {
          months.push({ currentMonth: d.getMonth() + 1, currentYear: d.getFullYear() });
          d.setMonth(d.getMonth() + 1);
        }
        dateFilter.$or = months;
      }
    }

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
        { $match: dateFilter },
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
