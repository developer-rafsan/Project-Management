import mongoose from 'mongoose'

const aiMemorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['preference', 'fact', 'event', 'project', 'date', 'general'],
    default: 'general',
    index: true,
  },
  key: { type: String, required: true },
  value: { type: String, required: true },
  sourceSessionId: { type: String, default: null },
  lastAccessed: { type: Date, default: Date.now },
}, { timestamps: true })

aiMemorySchema.index({ userId: 1, category: 1 })
aiMemorySchema.index({ userId: 1, key: 1 }, { unique: true })

export default mongoose.models.AIMemory || mongoose.model('AIMemory', aiMemorySchema)
