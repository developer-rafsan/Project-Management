import { BaseRepository } from './BaseRepository'
import mongoose from 'mongoose'

const WorkspaceModel = mongoose.models.Workspace || mongoose.model('Workspace', new mongoose.Schema({}, { strict: false }))

export class WorkspaceRepository extends BaseRepository<any> {
  constructor() {
    super(WorkspaceModel)
  }

  async findBySlug(slug: string) {
    return this.findOne({ slug })
  }

  async findByOwner(ownerId: string) {
    return this.find({ owner: ownerId })
  }
}
