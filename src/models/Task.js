import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'archived'],
      default: 'pending',
    },
    source: {
      type: String,
      enum: ['manual', 'microsoft_teams', 'ai_detection'],
      default: 'manual',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: {
      type: Date,
    },
    project: {
      type: String,
      default: '',
    },
    labels: {
      type: [String],
      default: [],
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    sourceMessage: {
      type: String,
      default: '',
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    assignedByName: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ createdBy: 1, dueDate: 1 });

export default mongoose.models.Task || mongoose.model('Task', taskSchema);
