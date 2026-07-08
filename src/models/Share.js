import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['project', 'list'],
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  }],
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    default: null,
    index: { expires: 0 },
  },
  accessLevel: {
    type: String,
    enum: ['view', 'manager', 'full'],
    default: 'view',
  },
}, { timestamps: true });

export async function cleanupExpiredShares() {
  const now = new Date();
  const result = await mongoose.models.Share.deleteMany({ expiresAt: { $lte: now } });
  return result.deletedCount;
}

export default mongoose.models.Share || mongoose.model('Share', shareSchema);
