import { connectDB } from '../config/db.js';
import { env, assertRequiredEnv } from '../config/env.js';
import { ROLES, USER_STATUS } from '../constants/enums.js';
import { User } from '../models/User.js';

assertRequiredEnv();

try {
  if (!env.superAdminEmail || !env.superAdminPassword) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required to seed a Super Admin');
  }

  await connectDB();

  const existing = await User.findOne({ email: env.superAdminEmail });

  if (existing) {
    existing.name = env.superAdminName || existing.name;
    existing.role = ROLES.SUPER_ADMIN;
    existing.status = USER_STATUS.ACTIVE;
    if (env.superAdminPassword) existing.password = env.superAdminPassword;
    await existing.save();
    console.log(`Updated Super Admin: ${existing.email}`);
  } else {
    const user = await User.create({
      name: env.superAdminName || 'Super Admin',
      email: env.superAdminEmail,
      password: env.superAdminPassword,
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    console.log(`Created Super Admin: ${user.email}`);
  }

  process.exit(0);
} catch (error) {
  console.error('Failed to seed Super Admin');
  console.error(error.message);
  process.exit(1);
}
