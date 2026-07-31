import mongoose from 'mongoose';

const teamMembershipSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['lead', 'member'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

teamMembershipSchema.index({ team: 1, user: 1 }, { unique: true });

export default mongoose.models.TeamMembership || mongoose.model('TeamMembership', teamMembershipSchema);
