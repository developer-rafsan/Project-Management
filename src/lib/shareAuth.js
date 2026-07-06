import { connectDB } from '@/lib/mongodb';
import Share from '@/models/Share';
import ShareList from '@/models/ShareList';

export async function validateShareToken(token) {
  await connectDB();

  const share = await Share.findOne({ token }).lean();
  if (!share) return null;

  if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
    return null;
  }

  return {
    type: 'project',
    projectId: share.project.toString(),
    accessLevel: share.accessLevel || 'view',
    shareId: share._id.toString(),
  };
}

export async function validateShareListToken(token) {
  await connectDB();

  const share = await ShareList.findOne({ token }).lean();
  if (!share) return null;

  if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
    return null;
  }

  return {
    type: 'list',
    createdBy: share.createdBy.toString(),
    accessLevel: share.accessLevel || 'view',
    shareId: share._id.toString(),
  };
}
