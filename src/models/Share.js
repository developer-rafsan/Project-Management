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
  const expiredCount = await mongoose.models.Share.deleteMany({ expiresAt: { $lte: now } });

  const activeListIds = await mongoose.models.Share.find({
    type: 'list', $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
  }).distinct('projects').lean();

  const activeProjectIds = new Set();
  for (const ids of activeListIds) {
    for (const id of (ids || [])) {
      activeProjectIds.add(id.toString());
    }
  }

  const orphaned = await mongoose.models.Share.find({
    type: 'project', expiresAt: null, project: { $exists: true }
  }).lean();

  let orphanedCount = 0;
  for (const s of orphaned) {
    if (!activeProjectIds.has(s.project.toString())) {
      await mongoose.models.Share.findByIdAndDelete(s._id);
      orphanedCount++;
    }
  }

  return expiredCount + orphanedCount;
}

export default mongoose.models.Share || mongoose.model('Share', shareSchema);
