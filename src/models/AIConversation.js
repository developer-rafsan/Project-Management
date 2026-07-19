import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system', 'tool'],
    required: true,
  },
  content: { type: String, default: '' },
  toolCalls: [{ type: mongoose.Schema.Types.Mixed }],
  toolCallId: { type: String, default: null },
  name: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
}, { _id: false })

const aiConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  telegramId: { type: String, default: null, index: true },
  messages: [messageSchema],
  sessionId: { type: String, required: true, index: true },
  summary: { type: String, default: '' },
  messageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

aiConversationSchema.index({ userId: 1, sessionId: 1 }, { unique: true })

export default mongoose.models.AIConversation || mongoose.model('AIConversation', aiConversationSchema)
