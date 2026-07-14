import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Project from '@/models/Project';
import Activity from '@/models/Activity';

function getEffectiveMonthYear(project) {
  return { month: project.currentMonth, year: project.currentYear }
}

function getUserSharePct(project, userId) {
  const entry = (project.assignee || []).find(a => (a.user?.toString() || a.user) === userId)
  if (entry) return entry.percentage || 0
  const isOwner = project.owner?.toString() === userId
  if (isOwner) {
    const t = (project.assignee || []).reduce((s, a) => s + (a.percentage || 0), 0)
    return Math.max(0, 100 - t)
  }
  return 0
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const allParam = searchParams.get('all');
    const selectedMonth = parseInt(searchParams.get('selectedMonth'));
    const selectedYear = parseInt(searchParams.get('selectedYear'));
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const userId = session.user.id;

    const ownershipFilter = {
      $or: [
        { owner: userId },
        { 'assignee.user': userId },
      ],
    };

    let fromDate, toDate;
    if (allParam !== 'true' && !selectedMonth) {
      fromDate = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      toDate = toParam ? new Date(toParam) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    }

    let dbFilter = { ...ownershipFilter };
    if (selectedMonth) {
      dbFilter.currentMonth = selectedMonth;
      dbFilter.currentYear = selectedYear;
    }

    const allProjects = await Project.find(dbFilter)
      .select('_id status price startDate createdAt currentMonth currentYear fiverrFeeEnabled owner assignee')
      .lean();

    let filtered = allProjects;
    if (allParam !== 'true' && !selectedMonth) {
      filtered = allProjects.filter(p => {
        const eff = getEffectiveMonthYear(p)
        const pd = new Date(eff.year, eff.month - 1, 1)
        const monthEnd = new Date(eff.year, eff.month, 0, 23, 59, 59, 999)
        if (fromDate && monthEnd < fromDate) return false
        if (toDate && pd > toDate) return false
        return true
      })
    }

    const { totalProjects, runningProjects, completedProjects, pendingProjects, onHoldProjects, revisionProjects, statusMap, priceMap, dayMap, myPriceMap, myFeeDelivered } = filtered.reduce((acc, p) => {
      const sharePct = getUserSharePct(p, userId)
      const myPrice = p.price ? (p.price * sharePct / 100) : 0

      acc.totalProjects++
      if (p.status === 'In Progress') acc.runningProjects++
      if (p.status === 'Delivered') acc.completedProjects++
      if (p.status === 'Pending') acc.pendingProjects++
      if (p.status === 'On Hold') acc.onHoldProjects++
      if (p.status === 'Revision') acc.revisionProjects++
      if (p.status) {
        acc.statusMap[p.status] = (acc.statusMap[p.status] || 0) + 1
        acc.priceMap[p.status] = (acc.priceMap[p.status] || 0) + (p.price || 0)
        acc.myPriceMap[p.status] = (acc.myPriceMap[p.status] || 0) + myPrice
      }
      if (p.status === 'Delivered' && p.fiverrFeeEnabled !== false) {
        acc.myFeeDelivered += myPrice
      }
      if (p.startDate) {
        const d = new Date(p.startDate)
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
        acc.dayMap[key] = (acc.dayMap[key] || 0) + 1
      }
      return acc
    }, { totalProjects: 0, runningProjects: 0, completedProjects: 0, pendingProjects: 0, onHoldProjects: 0, revisionProjects: 0, statusMap: {}, priceMap: {}, dayMap: {}, myPriceMap: {}, myFeeDelivered: 0 })

    const statusGrouped = Object.entries(statusMap).map(([key, count]) => ({ _id: key, count }))
    const priceByStatus = Object.entries(priceMap).map(([key, total]) => ({ _id: key, total }))
    const myPriceByStatus = Object.entries(myPriceMap).map(([key, total]) => ({ _id: key, total }))

    const dailyProgress = Object.entries(dayMap)
      .map(([key, count]) => {
        const [year, month, day] = key.split('-').map(Number)
        return { _id: { year, month, day }, count }
      })
      .sort((a, b) => {
        if (a._id.year !== b._id.year) return a._id.year - b._id.year
        if (a._id.month !== b._id.month) return a._id.month - b._id.month
        return a._id.day - b._id.day
      })

    const filteredIds = filtered.map(p => p._id)

    const [recentProjects, recentUpdates] = await Promise.all([
      Project.find({ _id: { $in: filteredIds } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Activity.find({ project: { $in: filteredIds } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('project', 'projectName')
        .populate('performedBy', 'name')
        .lean(),
    ])

    return NextResponse.json({
      total: totalProjects,
      running: runningProjects,
      completed: completedProjects,
      pending: pendingProjects,
      onHold: onHoldProjects,
      revision: revisionProjects,
      priceByStatus,
      myPriceByStatus,
      myFeeDelivered,
      recentProjects,
      recentUpdates,
      chartData: {
        byStatus: statusGrouped,
        monthlyProgress: dailyProgress.map((d) => ({
          year: d._id.year,
          month: d._id.month,
          day: d._id.day,
          count: d.count,
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/projects/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
