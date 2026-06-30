import mongoose from 'mongoose';

const simpleNoteSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

export default mongoose.models.SimpleNote || mongoose.model('SimpleNote', simpleNoteSchema);
