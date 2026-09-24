/**
 * One-off: seed only system_list_options (run when full seed fails due to other entities).
 * Usage: cd packages/database && pnpm exec tsx prisma/seed-system-lists.ts
 */
import { PRODUCT_TYPES } from '@nbos/shared';
import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const systemListOptions = [
  { listKey: 'PRODUCT_CATEGORY', code: 'CODE', label: 'Code', sortOrder: 0 },
  { listKey: 'PRODUCT_CATEGORY', code: 'WORDPRESS', label: 'WordPress', sortOrder: 1 },
  { listKey: 'PRODUCT_CATEGORY', code: 'SHOPIFY', label: 'Shopify', sortOrder: 2 },
  { listKey: 'PRODUCT_CATEGORY', code: 'MARKETING', label: 'Marketing', sortOrder: 3 },
  { listKey: 'PRODUCT_CATEGORY', code: 'OTHER', label: 'Other', sortOrder: 4 },
  ...PRODUCT_TYPES.map((code, sortOrder) => ({
    listKey: 'PRODUCT_TYPE',
    code,
    label: code,
    sortOrder,
  })),
];

async function main() {
  const prisma = createPrismaClient({ skipBudgetAssert: true, role: 'api' });
  const count = await prisma.systemListOption.count();
  if (count > 0) {
    console.log(`System list options already exist (${count} rows). Skipping.`);
    await prisma.$disconnect();
    return;
  }
  await prisma.systemListOption.createMany({ data: systemListOptions });
  console.log(`Seeded ${systemListOptions.length} system list options.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
