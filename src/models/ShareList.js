import mongoose from 'mongoose';

const shareListSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  }],
  expiresAt: {
    type: Date,
    default: null,
  },
  accessLevel: {
    type: String,
    enum: ['view', 'manager', 'full'],
    default: 'view',
  },
}, { timestamps: true });

// Allow model re-registration during hot-reload in development
if (process.env.NODE_ENV === 'development' && mongoose.models.ShareList) {
  delete mongoose.models.ShareList;
  if (mongoose.modelSchemas) delete mongoose.modelSchemas.ShareList;
  if (mongoose.schemas) delete mongoose.schemas.ShareList;
}
const ShareList = mongoose.models.ShareList || mongoose.model('ShareList', shareListSchema);
export default ShareList;
