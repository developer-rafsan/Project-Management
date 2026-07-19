import { connectDB } from '@/lib/mongodb'
import _Project from '@/models/Project'
import Activity from '@/models/Activity'

const Project = _Project as any

export class ProjectService {
  async getProjects(userId: string, filters?: Record<string, unknown>) {
    await connectDB()
    const query: Record<string, unknown> = {
      $or: [
        { owner: userId },
        { 'assignee.user': userId },
      ],
    }
    if (filters?.status) query.status = filters.status
    if (filters?.priority) query.priority = filters.priority
    if (filters?.search) {
      query.$or = [
        { projectName: { $regex: filters.search, $options: 'i' } },
        { orderId: { $regex: filters.search, $options: 'i' } },
      ]
    }
    return Project.find(query).sort({ createdAt: -1 }).lean()
  }

  async getProjectById(projectId: string) {
    await connectDB()
    return Project.findById(projectId).lean()
  }

  async createProject(userId: string, data: Record<string, unknown>) {
    await connectDB()
    const project = await Project.create({ ...data, owner: userId })
    await Activity.create({
      project: project._id,
      type: 'project_created',
      performedBy: userId,
      user: userId,
      description: `Project "${data.projectName}" created`,
    })
    return project.toObject()
  }

  async updateProject(projectId: string, userId: string, updates: Record<string, unknown>) {
    await connectDB()
    const project = await Project.findById(projectId)
    if (!project) throw new Error('Project not found')
    const isOwner = project.owner?.toString() === userId
    const isAssignee = project.assignee?.some((a: any) => a.user?.toString() === userId)
    if (!isOwner && !isAssignee) throw new Error('You do not have permission to update this project')
    Object.assign(project, updates)
    await project.save()
    await Activity.create({
      project: project._id,
      type: 'project_updated',
      performedBy: userId,
      user: userId,
      description: `Project "${project.projectName}" updated`,
    })
    return project.toObject()
  }

  async deleteProject(projectId: string, userId: string) {
    await connectDB()
    const project = await Project.findById(projectId)
    if (!project) throw new Error('Project not found')
    if (project.owner?.toString() !== userId) throw new Error('Only the owner can delete this project')
    await Activity.create({
      project: project._id,
      type: 'project_deleted',
      performedBy: userId,
      user: userId,
      description: `Project "${project.projectName}" deleted`,
    })
    await Project.findByIdAndDelete(projectId)
    return { deleted: true }
  }

  async assignDeveloper(projectId: string, userId: string, developerData: { name: string; email?: string }) {
    await connectDB()
    const project = await Project.findById(projectId)
    if (!project) throw new Error('Project not found')
    const alreadyAssigned = project.assignee?.some(
      (a: any) => a.name?.toLowerCase() === developerData.name.toLowerCase()
    )
    if (alreadyAssigned) throw new Error('Developer already assigned to this project')
    project.assignee = [
      ...(project.assignee || []),
      { user: null, name: developerData.name, email: developerData.email || '' },
    ]
    await project.save()
    await Activity.create({
      project: project._id,
      type: 'person_transfer',
      performedBy: userId,
      user: userId,
      description: `${developerData.name} assigned to "${project.projectName}"`,
    })
    return project.toObject()
  }

  async getProjectSummary(userId: string) {
    await connectDB()
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'assignee.user': userId }],
    }).lean()
    const total = projects.length
    const byStatus: Record<string, number> = {}
    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1
    }
    return { total, byStatus, projects }
  }
}
