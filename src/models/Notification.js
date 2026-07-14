import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['assignee_transfer_request', 'assignee_transfer_accepted', 'assignee_transfer_rejected', 'assignee_add_request', 'assignee_add_accepted', 'assignee_add_rejected', 'assignee_remove_request', 'assignee_remove_accepted', 'assignee_remove_rejected'],
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    read: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Notification) {
  mongoose.deleteModel('Notification')
}
const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
