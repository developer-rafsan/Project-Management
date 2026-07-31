import { BaseRepository } from './BaseRepository'
import mongoose from 'mongoose'

const OrganizationModel = mongoose.models.Organization || mongoose.model('Organization', new mongoose.Schema({}, { strict: false }))

export class OrganizationRepository extends BaseRepository<any> {
  constructor() {
    super(OrganizationModel)
  }

  async findBySlug(slug: string) {
    return this.findOne({ slug })
  }

  async findByOwner(ownerId: string) {
    return this.find({ owner: ownerId })
  }
}
