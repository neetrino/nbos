/**
 * One-off: seed only system_list_options (run when full seed fails due to other entities).
 * Usage: cd packages/database && pnpm exec tsx prisma/seed-system-lists.ts
 */
import { createPrismaClient } from '../src/client';
import type { PrismaClient as PrismaClientType } from '../src/generated/prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const systemListOptions = [
  { listKey: 'PRODUCT_TYPE', code: 'WEBSITE', label: 'Website', sortOrder: 0 },
  { listKey: 'PRODUCT_TYPE', code: 'MOBILE_APP', label: 'Mobile App', sortOrder: 1 },
  { listKey: 'PRODUCT_TYPE', code: 'WEB_APP', label: 'Web Application', sortOrder: 2 },
  { listKey: 'PRODUCT_TYPE', code: 'CRM', label: 'CRM System', sortOrder: 3 },
  { listKey: 'PRODUCT_TYPE', code: 'ECOMMERCE', label: 'E-Commerce', sortOrder: 4 },
  { listKey: 'PRODUCT_TYPE', code: 'SAAS', label: 'SaaS Platform', sortOrder: 5 },
  { listKey: 'PRODUCT_TYPE', code: 'LANDING', label: 'Landing Page', sortOrder: 6 },
  { listKey: 'PRODUCT_TYPE', code: 'ERP', label: 'ERP System', sortOrder: 7 },
  { listKey: 'PRODUCT_TYPE', code: 'LOGO', label: 'Logo', sortOrder: 8 },
  { listKey: 'PRODUCT_TYPE', code: 'SMM', label: 'SMM', sortOrder: 9 },
  { listKey: 'PRODUCT_TYPE', code: 'SEO', label: 'SEO', sortOrder: 10 },
  { listKey: 'PRODUCT_TYPE', code: 'OTHER', label: 'Other', sortOrder: 99 },
  { listKey: 'DEAL_TYPE', code: 'PRODUCT', label: 'Product', sortOrder: 0 },
  { listKey: 'DEAL_TYPE', code: 'EXTENSION', label: 'Extension', sortOrder: 1 },
  { listKey: 'DEAL_TYPE', code: 'MAINTENANCE', label: 'Maintenance', sortOrder: 2 },
  { listKey: 'DEAL_TYPE', code: 'OUTSOURCE', label: 'Outsource', sortOrder: 3 },
  { listKey: 'PAYMENT_TYPE', code: 'CLASSIC', label: 'Classic', sortOrder: 0 },
  { listKey: 'PAYMENT_TYPE', code: 'SUBSCRIPTION', label: 'Subscription', sortOrder: 1 },
  { listKey: 'EXTENSION_SIZE', code: 'MICRO', label: 'Micro', sortOrder: 0 },
  { listKey: 'EXTENSION_SIZE', code: 'SMALL', label: 'Small', sortOrder: 1 },
  { listKey: 'EXTENSION_SIZE', code: 'MEDIUM', label: 'Medium', sortOrder: 2 },
  { listKey: 'EXTENSION_SIZE', code: 'LARGE', label: 'Large', sortOrder: 3 },
];

async function main() {
  const prisma = createPrismaClient() as InstanceType<typeof PrismaClientType>;
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
