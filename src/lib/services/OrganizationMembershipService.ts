import { connectDB } from '@/lib/mongodb'
import OrganizationMembership from '@/models/OrganizationMembership'

export class OrganizationMembershipService {
  async addMember(orgId: string, userId: string, role: string, invitedBy: string) {
    await connectDB()
    const existing = await OrganizationMembership.findOne({ organization: orgId, user: userId })
    if (existing) {
      if (existing.status === 'suspended') {
        existing.status = 'active'
        existing.role = role as any
        await existing.save()
        return existing.toObject()
      }
      throw new Error('User is already a member of this organization')
    }
    const membership = await OrganizationMembership.create({
      organization: orgId,
      user: userId,
      role: role || 'member',
      invitedBy,
      joinedAt: new Date(),
      status: 'active',
    })
    return membership.toObject()
  }

  async removeMember(orgId: string, userId: string) {
    await connectDB()
    const membership = await OrganizationMembership.findOne({ organization: orgId, user: userId, status: 'active' })
    if (!membership) throw new Error('Member not found')
    membership.status = 'suspended'
    await membership.save()
    return { removed: true }
  }

  async updateMemberRole(orgId: string, userId: string, newRole: string) {
    await connectDB()
    const membership = await OrganizationMembership.findOne({ organization: orgId, user: userId, status: 'active' })
    if (!membership) throw new Error('Member not found')
    if (!['admin', 'manager', 'member', 'viewer'].includes(newRole)) {
      throw new Error('Invalid role')
    }
    membership.role = newRole as any
    await membership.save()
    return membership.toObject()
  }

  async getMembers(orgId: string) {
    await connectDB()
    return OrganizationMembership.find({ organization: orgId, status: 'active' })
      .populate('user', '_id name email image')
      .sort({ joinedAt: -1 })
      .lean()
  }

  async getUserRole(orgId: string, userId: string) {
    await connectDB()
    const membership = await OrganizationMembership.findOne({ organization: orgId, user: userId, status: 'active' }).lean()
    return membership?.role || null
  }
}
