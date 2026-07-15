import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    orderId: { type: String },
    projectName: { type: String, required: true },
    cms: { type: String, default: 'Other' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Delivered', 'Revision', 'On Hold', 'Cancelled'],
      default: 'Pending',
    },
    assignee: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      percentage: { type: Number, min: 0, max: 100, default: 0 },
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: { type: [String] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, default: '' },
    price: { type: Number, default: 0 },
    fiverrFeeEnabled: { type: Boolean, default: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    websites: [{
      name: { type: String, default: '' },
      url: { type: String, default: '' },
      username: { type: String, default: '' },
      password: { type: { iv: String, encryptedData: String }, default: {} },
    }],
    domainHosting: [{
      provider: { type: String, default: '' },
      domainUrl: { type: String, default: '' },
      email: { type: String, default: '' },
      password: { type: { iv: String, encryptedData: String }, default: {} },
      hostingProvider: { type: String, default: '' },
      hostingEmail: { type: String, default: '' },
      hostingPassword: { type: { iv: String, encryptedData: String }, default: {} },
      sameAccount: { type: Boolean, default: false },
    }],
    figmaLinks: [{ url: { type: String, default: '' } }],
    referenceLinks: [{ url: { type: String, default: '' } }],
    currentProjectDate: { type: Date },
    transferMonth: [{
      oldMonth: Number,
      newMonth: Number,
      newYear: Number,
      transferDate: Date,
      transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    personTransfer: [{
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      transferDate: Date,
    }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
