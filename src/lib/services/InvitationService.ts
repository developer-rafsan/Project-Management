import { connectDB } from '@/lib/mongodb'
import Invitation from '@/models/Invitation'
import OrganizationMembership from '@/models/OrganizationMembership'
import User from '@/models/User'
import { randomUUID } from 'crypto'

export class InvitationService {
  async createInvitation(data: {
    email?: string
    organization?: string
    workspace?: string
    team?: string
    role: string
  }, invitingUserId: string) {
    await connectDB()
    const token = randomUUID()
    const invitation = await Invitation.create({
      email: data.email,
      organization: data.organization,
      workspace: data.workspace,
      team: data.team,
      invitedBy: invitingUserId,
      role: data.role || 'member',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    return invitation.toObject()
  }

  async acceptInvitation(token: string, acceptingUserId: string) {
    await connectDB()
    const invitation = await Invitation.findOne({ token, status: 'pending' })
    if (!invitation) throw new Error('Invitation not found or already used')
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired'
      await invitation.save()
      throw new Error('Invitation has expired')
    }
    if (invitation.organization) {
      const existing = await OrganizationMembership.findOne({
        organization: invitation.organization,
        user: acceptingUserId,
      })
      if (existing) {
        if (existing.status === 'suspended') {
          existing.status = 'active'
          existing.role = invitation.role as any
          await existing.save()
        } else {
          throw new Error('You are already a member of this organization')
        }
      } else {
        await OrganizationMembership.create({
          organization: invitation.organization,
          user: acceptingUserId,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          status: 'active',
        })
      }
    }
    invitation.status = 'accepted'
    await invitation.save()
    return invitation.toObject()
  }

  async cancelInvitation(invitationId: string, userId: string) {
    await connectDB()
    const invitation = await Invitation.findById(invitationId)
    if (!invitation) throw new Error('Invitation not found')
    if (invitation.invitedBy?.toString() !== userId) {
      throw new Error('Only the inviter can cancel this invitation')
    }
    invitation.status = 'cancelled'
    await invitation.save()
    return { cancelled: true }
  }

  async getPendingForUser(email: string) {
    await connectDB()
    return Invitation.find({ email, status: 'pending', expiresAt: { $gt: new Date() } })
      .populate('organization', 'name slug')
      .populate('workspace', 'name')
      .populate('invitedBy', 'name email image')
      .sort({ createdAt: -1 })
      .lean()
  }

  async getOrganizationInvitations(orgId: string) {
    await connectDB()
    return Invitation.find({ organization: orgId })
      .populate('invitedBy', 'name email image')
      .sort({ createdAt: -1 })
      .lean()
  }
}
