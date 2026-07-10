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
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);