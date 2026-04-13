/**
 * Bootstrap script: creates the first admin (CEO) employee with a hashed password.
 * Run once after initial migration on a fresh database.
 *
 * Usage:
 *   ADMIN_EMAIL=you@company.com ADMIN_PASSWORD=secret pnpm seed:admin
 *   (or set vars in .env.local)
 */
import argon2 from 'argon2';
import { createPrismaClient } from '../src/client';
import type { PrismaClient as PrismaClientType } from '../src/generated/prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME ?? 'Admin';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME ?? 'User';

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD env vars are required');
    process.exit(1);
  }

  const prisma = createPrismaClient() as InstanceType<PrismaClientType>;

  const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });

  const admin = await prisma.employee.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      roleId: 'role-ceo',
      level: 'HEAD',
      status: 'ACTIVE',
    },
  });

  console.log(`✓ Admin created: ${admin.firstName} ${admin.lastName} <${admin.email}>`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
