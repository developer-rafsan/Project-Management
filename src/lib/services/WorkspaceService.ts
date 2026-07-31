import { connectDB } from '@/lib/mongodb'
import Workspace from '@/models/Workspace'

export class WorkspaceService {
  private generateSlug(name: string, suffix?: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return suffix ? `${base}-${suffix}` : base
  }

  async createWorkspace(data: { name: string; type?: string; organization?: string; settings?: Record<string, unknown> }, userId: string) {
    await connectDB()
    let slug = this.generateSlug(data.name)
    const existing = await Workspace.findOne({ slug })
    if (existing) {
      slug = this.generateSlug(data.name, Date.now().toString(36))
    }
    const workspace = await Workspace.create({
      name: data.name,
      slug,
      type: data.type || 'individual',
      owner: userId,
      organization: data.organization || null,
      settings: {
        defaultRole: 'admin',
        allowInvites: true,
        maxMembers: 10,
        ...(data.settings || {}),
      },
    })
    return workspace.toObject()
  }

  async getUserWorkspaces(userId: string) {
    await connectDB()
    return Workspace.find({ owner: userId }).sort({ createdAt: -1 }).lean()
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    await connectDB()
    const workspace = await Workspace.findById(workspaceId).lean()
    if (!workspace) throw new Error('Workspace not found')
    if (workspace.owner?.toString() !== userId) throw new Error('You do not have permission to access this workspace')
    return workspace
  }

  async updateWorkspace(workspaceId: string, userId: string, updates: Record<string, unknown>) {
    await connectDB()
    const workspace = await Workspace.findById(workspaceId)
    if (!workspace) throw new Error('Workspace not found')
    if (workspace.owner?.toString() !== userId) throw new Error('Only the owner can update this workspace')
    if (updates.name) {
      workspace.name = updates.name as string
    }
    if (updates.settings) {
      Object.assign(workspace.settings, updates.settings)
    }
    await workspace.save()
    return workspace.toObject()
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    await connectDB()
    const workspace = await Workspace.findById(workspaceId)
    if (!workspace) throw new Error('Workspace not found')
    if (workspace.owner?.toString() !== userId) throw new Error('Only the owner can delete this workspace')
    await Workspace.findByIdAndDelete(workspaceId)
    return { deleted: true }
  }

  async createDefaultWorkspace(userId: string, userName: string) {
    await connectDB()
    const existing = await Workspace.findOne({ owner: userId })
    if (existing) return existing.toObject()
    return this.createWorkspace({ name: `${userName}'s Workspace` }, userId)
  }
}
