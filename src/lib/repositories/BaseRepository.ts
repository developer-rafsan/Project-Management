import mongoose, { Model, Document } from 'mongoose'

type Filter = Record<string, unknown>
type Update = Record<string, unknown>

export class BaseRepository<T extends Document> {
  protected model: Model<T>

  constructor(model: Model<T>) {
    this.model = model
  }

  async findById(id: string): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return this.model.findById(id).exec()
  }

  async findOne(filter: Filter): Promise<T | null> {
    return this.model.findOne(filter).exec()
  }

  async find(filter: Filter = {}): Promise<T[]> {
    return this.model.find(filter).exec()
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data)
  }

  async updateById(id: string, updates: Update): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return this.model.findByIdAndUpdate(id, updates, { returnDocument: 'after' }).exec()
  }

  async updateOne(filter: Filter, updates: Update): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, updates, { returnDocument: 'after' }).exec()
  }

  async deleteById(id: string): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return this.model.findByIdAndDelete(id).exec()
  }

  async deleteOne(filter: Filter): Promise<boolean> {
    const result = await this.model.deleteOne(filter).exec()
    return result.deletedCount > 0
  }

  async count(filter: Filter = {}): Promise<number> {
    return this.model.countDocuments(filter).exec()
  }

  async exists(filter: Filter): Promise<boolean> {
    return this.model.exists(filter).then(Boolean)
  }
}
