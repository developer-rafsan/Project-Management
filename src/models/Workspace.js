import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['individual', 'organization'],
      default: 'individual',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    settings: {
      defaultRole: {
        type: String,
        enum: ['admin', 'manager', 'member', 'viewer'],
        default: 'admin',
      },
      allowInvites: { type: Boolean, default: true },
      maxMembers: { type: Number, default: 10 },
      viewMode: { type: String, enum: ['list', 'grid'], default: 'list' },
      monthStartDay: { type: Number, default: 1 },
      fiverrFeeEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);
