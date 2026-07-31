import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
    },
  },
  { timestamps: true }
);

noteSchema.index({ workspace: 1, createdBy: 1 });

export default mongoose.models.Note || mongoose.model('Note', noteSchema);
