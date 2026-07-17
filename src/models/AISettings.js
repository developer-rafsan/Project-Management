import mongoose from 'mongoose'

const aiSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  enabled: { type: Boolean, default: true },
  provider: { type: String, default: 'openrouter', enum: ['openrouter'] },
  model: { type: String, default: 'deepseek/deepseek-v4-flash' },
  temperature: { type: Number, default: 0.3, min: 0, max: 2 },
  maxTokens: { type: Number, default: 1024, min: 64, max: 16384 },
  promptTemplate: {
    type: String,
    default: `You are a helpful Project Management AI Assistant.
You help users manage their projects, tasks, and team members.
Use the available tools to execute actions.
Be concise and friendly.`,
  },
  totalTokensUsed: { type: Number, default: 0 },
  totalTokensLimit: { type: Number, default: 7000000 },
}, { timestamps: true })

export default mongoose.models.AISettings || mongoose.model('AISettings', aiSettingsSchema)
