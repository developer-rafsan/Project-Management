import mongoose from 'mongoose';

const organizationMembershipSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

organizationMembershipSchema.index({ organization: 1, user: 1 }, { unique: true });

export default mongoose.models.OrganizationMembership || mongoose.model('OrganizationMembership', organizationMembershipSchema);
