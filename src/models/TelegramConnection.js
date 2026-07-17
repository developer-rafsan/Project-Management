import mongoose from 'mongoose'

const telegramConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  telegramId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: { type: String, default: null },
  chatId: { type: String, required: true },
  isConnected: { type: Boolean, default: true },
  connectedAt: { type: Date, default: Date.now },
  disconnectedAt: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.models.TelegramConnection || mongoose.model('TelegramConnection', telegramConnectionSchema)
