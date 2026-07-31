import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Workspace from '@/models/Workspace';
import Project from '@/models/Project';

async function migrateDefaultWorkspaces() {
  console.log('Starting default workspace migration...');

  await connectDB();

  const users = await User.find({ defaultWorkspaceCreated: { $ne: true } });

  console.log(`Found ${users.length} users without default workspace.`);

  let created = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const existing = await Workspace.findOne({ owner: user._id });
      if (existing) {
        await User.findByIdAndUpdate(user._id, { defaultWorkspaceCreated: true });
        created++;
        continue;
      }

      const workspace = await Workspace.create({
        name: `${user.name || 'User'}'s Workspace`,
        slug: `workspace-${user._id.toString().slice(-8)}`,
        type: 'individual',
        owner: user._id,
      });

      await Project.updateMany(
        { $or: [{ owner: user._id }, { 'assignee.user': user._id }] },
        { workspace: workspace._id }
      );

      await User.findByIdAndUpdate(user._id, { defaultWorkspaceCreated: true });

      created++;
      console.log(`  Created workspace for ${user.email || user._id}`);
    } catch (err) {
      failed++;
      console.error(`  Failed for user ${user.email || user._id}:`, err.message);
    }
  }

  console.log(`Migration complete. Created: ${created}, Failed: ${failed}`);
}

migrateDefaultWorkspaces()
  .then(() => {
    console.log('Migration finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
