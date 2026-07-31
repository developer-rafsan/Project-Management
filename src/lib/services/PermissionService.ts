import { connectDB } from '@/lib/mongodb'
import Workspace from '@/models/Workspace'
import Organization from '@/models/Organization'
import OrganizationMembership from '@/models/OrganizationMembership'
import Project from '@/models/Project'

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  member: 1,
  manager: 2,
  admin: 3,
}

export class PermissionService {
  async requireAuth(session: any): Promise<string> {
    if (!session?.user?.id) {
      throw new PermissionError('Authentication required')
    }
    return session.user.id
  }

  async canAccessWorkspace(userId: string, workspaceId: string): Promise<boolean> {
    await connectDB()
    const workspace = await Workspace.findById(workspaceId).lean()
    if (!workspace) return false
    if (workspace.owner?.toString() === userId) return true
    if (workspace.organization) {
      const membership = await OrganizationMembership.findOne({
        organization: workspace.organization,
        user: userId,
        status: 'active',
      }).lean()
      return !!membership
    }
    return false
  }

  async requireWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
    const hasAccess = await this.canAccessWorkspace(userId, workspaceId)
    if (!hasAccess) {
      throw new PermissionError('You do not have access to this workspace')
    }
  }

  async getWorkspaceRole(userId: string, workspaceId: string): Promise<string | null> {
    await connectDB()
    const workspace = await Workspace.findById(workspaceId).lean()
    if (!workspace) return null
    if (workspace.owner?.toString() === userId) return 'admin'
    if (workspace.organization) {
      const membership = await OrganizationMembership.findOne({
        organization: workspace.organization,
        user: userId,
        status: 'active',
      }).lean()
      return membership?.role || null
    }
    return null
  }

  async getOrgRole(userId: string, orgId: string): Promise<string | null> {
    await connectDB()
    const org = await Organization.findById(orgId).lean()
    if (!org) return null
    if (org.owner?.toString() === userId) return 'admin'
    const membership = await OrganizationMembership.findOne({
      organization: orgId,
      user: userId,
      status: 'active',
    }).lean()
    return membership?.role || null
  }

  async requireOrgRole(userId: string, orgId: string, minRole: string): Promise<void> {
    const role = await this.getOrgRole(userId, orgId)
    if (!role) {
      throw new PermissionError('You are not a member of this organization')
    }
    if ((ROLE_HIERARCHY[role] ?? -1) < (ROLE_HIERARCHY[minRole] ?? 0)) {
      throw new PermissionError(`You need at least ${minRole} role for this action`)
    }
  }

  async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    await connectDB()
    const project = await Project.findById(projectId).lean()
    if (!project) return false
    const isOwner = project.owner?.toString() === userId
    const isAssignee = project.assignee?.some((a: any) => a.user?.toString() === userId)
    if (isOwner || isAssignee) return true
    if (project.workspace) {
      return this.canAccessWorkspace(userId, project.workspace.toString())
    }
    return false
  }

  async requireProjectAccess(userId: string, projectId: string): Promise<void> {
    const hasAccess = await this.canAccessProject(userId, projectId)
    if (!hasAccess) {
      throw new PermissionError('You do not have access to this project')
    }
  }

  async isAdmin(userId: string, orgId?: string): Promise<boolean> {
    if (!orgId) return false
    const role = await this.getOrgRole(userId, orgId)
    return role === 'admin'
  }

  async hasPermission(userId: string, permission: string, resourceId: string): Promise<boolean> {
    switch (permission) {
      case 'workspace:read':
      case 'workspace:write':
        return this.canAccessWorkspace(userId, resourceId)
      case 'project:read':
      case 'project:write':
        return this.canAccessProject(userId, resourceId)
      case 'org:admin':
        return this.isAdmin(userId, resourceId)
      default:
        return false
    }
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PermissionError'
  }
}

export const permissionService = new PermissionService()
