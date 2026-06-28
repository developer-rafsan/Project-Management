import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      default: '',
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
      enum: ['WordPress', 'WooCommerce', 'Shopify', 'Webflow', 'Next.js', 'React', 'Laravel', 'PHP', 'Custom', 'HTML', 'Other'],
      default: 'Other',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Waiting Client', 'Delivered', 'On Hold', 'Cancelled'],
      default: 'Pending',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: {
      type: [String],
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
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
        transferDate: Date,
        transferredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
