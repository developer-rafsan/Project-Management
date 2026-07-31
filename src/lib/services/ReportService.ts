import { connectDB } from '@/lib/mongodb'
import Project from '@/models/Project'
import Activity from '@/models/Activity'

export class ReportService {
  async generateOrgReport(orgId: string, dateRange?: { from: Date; to: Date }) {
    await connectDB()
    const match: Record<string, unknown> = {}
    if (dateRange?.from || dateRange?.to) {
      match.createdAt = {}
      if (dateRange.from) match.createdAt.$gte = dateRange.from
      if (dateRange.to) match.createdAt.$lte = dateRange.to
    }
    const projects = await Project.find(match).lean()
    const total = projects.length
    const byStatus: Record<string, number> = {}
    const totalPrice = projects.reduce((sum, p) => sum + (p.price || 0), 0)
    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1
    }
    return { total, byStatus, totalPrice, projects }
  }

  async generateWorkspaceReport(workspaceId: string, dateRange?: { from: Date; to: Date }) {
    await connectDB()
    const match: Record<string, unknown> = { workspace: workspaceId }
    if (dateRange?.from || dateRange?.to) {
      match.createdAt = {}
      if (dateRange.from) match.createdAt.$gte = dateRange.from
      if (dateRange.to) match.createdAt.$lte = dateRange.to
    }
    const projects = await Project.find(match).lean()
    const total = projects.length
    const byStatus: Record<string, number> = {}
    const totalPrice = projects.reduce((sum, p) => sum + (p.price || 0), 0)
    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1
    }
    return { total, byStatus, totalPrice, projects }
  }

  async generateMemberReport(userId: string, workspaceId: string, dateRange?: { from: Date; to: Date }) {
    await connectDB()
    const match: Record<string, unknown> = {
      workspace: workspaceId,
      $or: [{ owner: userId }, { 'assignee.user': userId }],
    }
    if (dateRange?.from || dateRange?.to) {
      match.createdAt = {}
      if (dateRange.from) match.createdAt.$gte = dateRange.from
      if (dateRange.to) match.createdAt.$lte = dateRange.to
    }
    const projects = await Project.find(match).lean()
    const total = projects.length
    const owned = projects.filter((p) => p.owner?.toString() === userId).length
    const assigned = projects.filter((p) => p.assignee?.some((a: any) => a.user?.toString() === userId)).length
    return { total, owned, assigned, projects }
  }
}
