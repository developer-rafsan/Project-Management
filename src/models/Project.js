import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
    },
    projectName: {
      type: String,
      required: true,
    },
    websiteUrl: {
      type: String,
      default: '',
    },
    websiteUsername: {
      type: String,
      default: '',
    },
    websitePassword: {
      type: {
        iv: String,
        encryptedData: String,
      },
      default: {},
    },
    cms: {
      type: String,
      default: 'Other',
    },
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
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: {
      type: [String],
    },
    startDate: {
      type: Date,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    fiverrFeeEnabled: {
      type: Boolean,
      default: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    additionalWebsites: [{
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
    figmaLinks: [{
      url: { type: String, default: '' },
    }],
    referenceLinks: [{
      url: { type: String, default: '' },
    }],
    currentMonth: {
      type: Number,
    },
    currentYear: {
      type: Number,
    },
    transferHistory: [
      {
        oldMonth: Number,
        newMonth: Number,
        newYear: Number,
        transferDate: Date,
        transferredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    personTransferHistory: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        transferDate: Date,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
