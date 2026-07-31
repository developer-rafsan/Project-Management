import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    email: { type: String },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member', 'viewer'],
      default: 'member',
    },
    token: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'cancelled'],
      default: 'pending',
    },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

export default mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema);
