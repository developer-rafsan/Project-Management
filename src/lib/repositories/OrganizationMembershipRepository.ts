import { BaseRepository } from './BaseRepository'
import mongoose from 'mongoose'

const OrganizationMembershipModel = mongoose.models.OrganizationMembership || mongoose.model('OrganizationMembership', new mongoose.Schema({}, { strict: false }))

export class OrganizationMembershipRepository extends BaseRepository<any> {
  constructor() {
    super(OrganizationMembershipModel)
  }

  async findByOrganization(orgId: string) {
    return this.find({ organization: orgId })
  }

  async findMember(orgId: string, userId: string) {
    return this.findOne({ organization: orgId, user: userId })
  }

  async findActiveByUser(userId: string) {
    return this.find({ user: userId, status: 'active' })
  }

  async findActiveByOrganization(orgId: string) {
    return this.find({ organization: orgId, status: 'active' })
  }
}
