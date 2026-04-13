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
  { listKey: 'PRODUCT_CATEGORY', code: 'CODE', label: 'Code', sortOrder: 0 },
  { listKey: 'PRODUCT_CATEGORY', code: 'WORDPRESS', label: 'WordPress', sortOrder: 1 },
  { listKey: 'PRODUCT_CATEGORY', code: 'SHOPIFY', label: 'Shopify', sortOrder: 2 },
  { listKey: 'PRODUCT_CATEGORY', code: 'MARKETING', label: 'Marketing', sortOrder: 3 },
  { listKey: 'PRODUCT_CATEGORY', code: 'OTHER', label: 'Other', sortOrder: 4 },

  {
    listKey: 'PRODUCT_TYPE',
    code: 'BUSINESS_CARD_WEBSITE',
    label: 'Business Card Website',
    sortOrder: 0,
  },
  { listKey: 'PRODUCT_TYPE', code: 'COMPANY_WEBSITE', label: 'Company Website', sortOrder: 1 },
  { listKey: 'PRODUCT_TYPE', code: 'MOBILE_APP', label: 'Mobile App', sortOrder: 2 },
  { listKey: 'PRODUCT_TYPE', code: 'WEB_APP', label: 'Web Application', sortOrder: 3 },
  { listKey: 'PRODUCT_TYPE', code: 'CRM', label: 'CRM System', sortOrder: 4 },
  { listKey: 'PRODUCT_TYPE', code: 'ECOMMERCE', label: 'E-Commerce', sortOrder: 5 },
  { listKey: 'PRODUCT_TYPE', code: 'SAAS', label: 'SaaS Platform', sortOrder: 6 },
  { listKey: 'PRODUCT_TYPE', code: 'LANDING', label: 'Landing Page', sortOrder: 7 },
  { listKey: 'PRODUCT_TYPE', code: 'ERP', label: 'ERP System', sortOrder: 8 },
  { listKey: 'PRODUCT_TYPE', code: 'LOGO', label: 'Logo', sortOrder: 9 },
  { listKey: 'PRODUCT_TYPE', code: 'BRANDING', label: 'Branding', sortOrder: 10 },
  { listKey: 'PRODUCT_TYPE', code: 'DESIGN', label: 'Design', sortOrder: 11 },
  { listKey: 'PRODUCT_TYPE', code: 'SEO', label: 'SEO', sortOrder: 12 },
  { listKey: 'PRODUCT_TYPE', code: 'PPC', label: 'PPC', sortOrder: 13 },
  { listKey: 'PRODUCT_TYPE', code: 'SMM', label: 'SMM', sortOrder: 14 },
  { listKey: 'PRODUCT_TYPE', code: 'OTHER', label: 'Other', sortOrder: 99 },
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
