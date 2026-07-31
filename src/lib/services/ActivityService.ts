import { connectDB } from '@/lib/mongodb'
import Activity from '@/models/Activity'

export class ActivityService {
  async logActivity(data: {
    type: string
    project?: string
    performedBy: string
    workspace?: string
    organization?: string
    description?: string
    previousStatus?: string
    newStatus?: string
    note?: string
  }) {
    await connectDB()
    const activity = await Activity.create({
      project: data.project,
      type: data.type,
      performedBy: data.performedBy,
      description: data.description || '',
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      note: data.note,
    })
    return activity.toObject()
  }

  async getActivityForOrganization(orgId: string, filters?: { limit?: number; offset?: number }) {
    await connectDB()
    const limit = filters?.limit || 50
    const skip = filters?.offset || 0
    return Activity.find({ organization: orgId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', '_id name email image')
      .lean()
  }

  async getActivityForWorkspace(workspaceId: string, filters?: { limit?: number; offset?: number }) {
    await connectDB()
    const limit = filters?.limit || 50
    const skip = filters?.offset || 0
    return Activity.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', '_id name email image')
      .lean()
  }

  async getActivityForProject(projectId: string, filters?: { limit?: number; offset?: number }) {
    await connectDB()
    const limit = filters?.limit || 100
    const skip = filters?.offset || 0
    return Activity.find({ project: projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', '_id name email image')
      .lean()
  }
}
