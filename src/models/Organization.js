import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    logo: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    settings: {
      allowMemberInvites: { type: Boolean, default: true },
      requireAdminApproval: { type: Boolean, default: true },
      maxTeams: { type: Number, default: 20 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
