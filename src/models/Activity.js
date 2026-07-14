import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    type: {
      type: String,
      enum: ['status_change', 'month_transfer', 'person_transfer', 'project_created', 'project_updated', 'project_deleted', 'ownership_transfer', 'progress_updated', 'website_added', 'website_updated', 'website_removed', 'domain_added', 'domain_updated', 'domain_removed', 'link_updated', 'price_updated', 'note_added', 'note_updated', 'note_deleted', 'meta_updated'],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    previousStatus: String,
    newStatus: String,
    oldMonth: Number,
    newMonth: Number,
    newYear: Number,
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: String,
    description: String,
    percentage: Number,
  },
  { timestamps: true }
);

export default mongoose.models.Activity || mongoose.model('Activity', activitySchema);
