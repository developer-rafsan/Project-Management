import { connectDB } from '@/lib/mongodb'
import Organization from '@/models/Organization'
import Workspace from '@/models/Workspace'

export class OrganizationService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async createOrganization(data: { name: string; description?: string }, userId: string) {
    await connectDB()
    let slug = this.generateSlug(data.name)
    const existing = await Organization.findOne({ slug })
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
    const org = await Organization.create({
      name: data.name,
      slug,
      description: data.description || '',
      owner: userId,
    })
    await Workspace.create({
      name: `${data.name} Workspace`,
      slug: `${slug}-workspace`,
      type: 'organization',
      owner: userId,
      organization: org._id,
    })
    return org.toObject()
  }

  async getUserOrganizations(userId: string) {
    await connectDB()
    return Organization.find({ owner: userId }).sort({ createdAt: -1 }).lean()
  }

  async getOrganizationById(orgId: string, userId: string) {
    await connectDB()
    const org = await Organization.findById(orgId).lean()
    if (!org) throw new Error('Organization not found')
    if (org.owner?.toString() !== userId) throw new Error('You do not have permission to access this organization')
    return org
  }

  async updateOrganization(orgId: string, userId: string, updates: Record<string, unknown>) {
    await connectDB()
    const org = await Organization.findById(orgId)
    if (!org) throw new Error('Organization not found')
    if (org.owner?.toString() !== userId) throw new Error('Only the owner can update this organization')
    if (updates.name) org.name = updates.name as string
    if (updates.description !== undefined) org.description = updates.description as string
    if (updates.logo !== undefined) org.logo = updates.logo as string
    if (updates.settings) Object.assign(org.settings, updates.settings)
    await org.save()
    return org.toObject()
  }

  async deleteOrganization(orgId: string, userId: string) {
    await connectDB()
    const org = await Organization.findById(orgId)
    if (!org) throw new Error('Organization not found')
    if (org.owner?.toString() !== userId) throw new Error('Only the owner can delete this organization')
    await Workspace.deleteMany({ organization: orgId })
    await Organization.findByIdAndDelete(orgId)
    return { deleted: true }
  }

  async getOrganizationWorkspaces(orgId: string) {
    await connectDB()
    return Workspace.find({ organization: orgId }).sort({ createdAt: -1 }).lean()
  }
}
