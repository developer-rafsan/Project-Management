import mongoose from 'mongoose';

const projectUpdateSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    previousStatus: {
      type: String,
    },
    newStatus: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ProjectUpdate || mongoose.model('ProjectUpdate', projectUpdateSchema);
