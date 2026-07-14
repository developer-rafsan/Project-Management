import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
    },
    monthStartDay: {
      type: Number,
      default: 1,
    },
    viewMode: {
      type: String,
      enum: ['list', 'grid'],
      default: 'list',
    },
    fiverrFeeEnabled: {
      type: Boolean,
      default: true,
    },
    accountType: {
      type: String,
      enum: ['single', 'organization'],
    },
    phone: { type: String },
    address: { type: String },
    profession: { type: String },
    organizationName: { type: String },
    organizationEmail: { type: String },
    organizationPhone: { type: String },
    organizationAddress: { type: String },
    organizationWebsite: { type: String },
    organizationLogo: { type: String },
    organizationRole: { type: String },
    setupComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
