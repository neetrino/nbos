import { createPrismaClient } from '../src/client';
import type { PrismaClient as PrismaClientType } from '../src/generated/prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function main() {
  const prisma = createPrismaClient() as InstanceType<PrismaClientType>;

  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.taskLink.deleteMany();
  await prisma.taskChecklistItem.deleteMany();
  await prisma.taskChecklist.deleteMany();
  await prisma.bonusEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.task.deleteMany();
  await prisma.extension.deleteMany();
  await prisma.product.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.project.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.company.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.systemListOption.deleteMany();
  console.log('  ✓ Cleaned');

  console.log('Seeding database...');

  // ── Employees ──────────────────────────────────────────────
  const ceo = await prisma.employee.upsert({
    where: { email: 'suren@neetrino.com' },
    update: {},
    create: {
      firstName: 'Suren',
      lastName: 'Babajanyan',
      email: 'suren@neetrino.com',
      roleId: 'role-ceo',
      level: 'HEAD',
      status: 'ACTIVE',
    },
  });
  const seller = await prisma.employee.upsert({
    where: { email: 'anna@neetrino.com' },
    update: {},
    create: {
      firstName: 'Anna',
      lastName: 'Petrosyan',
      email: 'anna@neetrino.com',
      roleId: 'role-seller',
      level: 'SENIOR',
      status: 'ACTIVE',
    },
  });
  const pm = await prisma.employee.upsert({
    where: { email: 'artur@neetrino.com' },
    update: {},
    create: {
      firstName: 'Artur',
      lastName: 'Hakobyan',
      email: 'artur@neetrino.com',
      roleId: 'role-pm',
      level: 'SENIOR',
      status: 'ACTIVE',
    },
  });
  const pm2 = await prisma.employee.upsert({
    where: { email: 'tigran@neetrino.com' },
    update: {},
    create: {
      firstName: 'Tigran',
      lastName: 'Avetisyan',
      email: 'tigran@neetrino.com',
      roleId: 'role-pm',
      level: 'MIDDLE',
      status: 'ACTIVE',
    },
  });
  const dev = await prisma.employee.upsert({
    where: { email: 'karen@neetrino.com' },
    update: {},
    create: {
      firstName: 'Karen',
      lastName: 'Sargsyan',
      email: 'karen@neetrino.com',
      roleId: 'role-developer',
      level: 'MIDDLE',
      status: 'ACTIVE',
    },
  });
  const designer = await prisma.employee.upsert({
    where: { email: 'nare@neetrino.com' },
    update: {},
    create: {
      firstName: 'Nare',
      lastName: 'Grigoryan',
      email: 'nare@neetrino.com',
      roleId: 'role-designer',
      level: 'MIDDLE',
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Employees (6)');

  // ── Contacts ───────────────────────────────────────────────
  const contact1 = await prisma.contact.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      firstName: 'David',
      lastName: 'Abrahamyan',
      phone: '+37491234567',
      email: 'david@acme.am',
      role: 'CLIENT',
    },
  });
  const contact2 = await prisma.contact.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      firstName: 'Maria',
      lastName: 'Gevorgyan',
      phone: '+37493456789',
      email: 'maria@techstart.am',
      role: 'CLIENT',
    },
  });
  const contact3 = await prisma.contact.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      firstName: 'Alex',
      lastName: 'Johnson',
      phone: '+14155551234',
      email: 'alex@globalcorp.com',
      role: 'CLIENT',
    },
  });
  const contact4 = await prisma.contact.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      firstName: 'Armen',
      lastName: 'Sahakyan',
      phone: '+37499112233',
      email: 'armen@partneragency.am',
      role: 'PARTNER',
    },
  });
  const contact5 = await prisma.contact.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      firstName: 'Anahit',
      lastName: 'Martirosyan',
      phone: '+37477123456',
      email: 'anahit@medtech.am',
      role: 'CLIENT',
    },
  });
  const contact6 = await prisma.contact.upsert({
    where: { id: '00000000-0000-0000-0000-000000000006' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000006',
      firstName: 'Vardan',
      lastName: 'Stepanyan',
      phone: '+37455998877',
      email: 'vardan@logistics.am',
      role: 'CLIENT',
    },
  });
  console.log('  ✓ Contacts (6)');

  // ── Companies ──────────────────────────────────────────────
  const company1 = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'ACME Solutions LLC',
      type: 'LEGAL',
      taxStatus: 'TAX',
      contactId: contact1.id,
      taxId: '01234567',
      legalAddress: 'Yerevan, Armenia',
    },
  });
  const company2 = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'TechStart',
      type: 'SOLE_PROPRIETOR',
      taxStatus: 'TAX_FREE',
      contactId: contact2.id,
    },
  });
  const company3 = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      name: 'MedTech Solutions',
      type: 'LEGAL',
      taxStatus: 'TAX',
      contactId: contact5.id,
      taxId: '08765432',
      legalAddress: 'Yerevan, Armenia',
    },
  });
  const company4 = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000013' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000013',
      name: 'Logistics Pro',
      type: 'LEGAL',
      taxStatus: 'TAX',
      contactId: contact6.id,
      legalAddress: 'Gyumri, Armenia',
    },
  });
  console.log('  ✓ Companies (4)');

  // ── Partners ───────────────────────────────────────────────
  const partner1 = await prisma.partner.upsert({
    where: { id: '00000000-0000-0000-0000-000000000030' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000030',
      name: 'Digital Partners Agency',
      type: 'PREMIUM',
      direction: 'INBOUND',
      defaultPercent: 25,
      status: 'ACTIVE',
      contactId: contact4.id,
    },
  });
  console.log('  ✓ Partners (1)');

  // ── Projects (5) ───────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { code: 'P-2026-0001' },
    update: {},
    create: {
      code: 'P-2026-0001',
      name: 'ACME Corporate Website',
      type: 'CUSTOM_CODE',
      contactId: contact1.id,
      companyId: company1.id,
      sellerId: seller.id,
      pmId: pm.id,
      deadline: new Date('2026-06-15'),
      description: 'Full corporate website with CMS and blog',
    },
  });
  const project2 = await prisma.project.upsert({
    where: { code: 'P-2026-0002' },
    update: {},
    create: {
      code: 'P-2026-0002',
      name: 'TechStart Mobile App',
      type: 'MIX',
      contactId: contact2.id,
      companyId: company2.id,
      sellerId: seller.id,
      pmId: pm.id,
      deadline: new Date('2026-08-01'),
      description: 'Cross-platform mobile app (React Native)',
    },
  });
  const project3 = await prisma.project.upsert({
    where: { code: 'P-2026-0003' },
    update: {},
    create: {
      code: 'P-2026-0003',
      name: 'GlobalCorp CRM System',
      type: 'WHITE_LABEL',
      contactId: contact3.id,
      sellerId: ceo.id,
      pmId: pm2.id,
      deadline: new Date('2026-12-01'),
      description: 'White-label CRM for enterprise client',
    },
  });
  const project4 = await prisma.project.upsert({
    where: { code: 'P-2026-0004' },
    update: {},
    create: {
      code: 'P-2026-0004',
      name: 'MedTech Patient Portal',
      type: 'CUSTOM_CODE',
      contactId: contact5.id,
      companyId: company3.id,
      sellerId: seller.id,
      pmId: pm.id,
      deadline: new Date('2026-09-30'),
      description: 'Patient portal and appointment system',
    },
  });
  const project5 = await prisma.project.upsert({
    where: { code: 'P-2026-0005' },
    update: {},
    create: {
      code: 'P-2026-0005',
      name: 'Logistics Pro Dashboard',
      type: 'MIX',
      contactId: contact6.id,
      companyId: company4.id,
      sellerId: seller.id,
      pmId: pm2.id,
      deadline: new Date('2026-07-15'),
      description: 'Fleet and delivery management dashboard',
    },
  });
  console.log('  ✓ Projects (5)');

  // ── Products (12 — several per project) ────────────────────

  // Project 1: ACME — 3 products
  const prod1 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000020',
      projectId: project1.id,
      name: 'Corporate Website',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      status: 'DEVELOPMENT',
      pmId: pm.id,
      deadline: new Date('2026-06-15'),
    },
  });
  const prod2 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000021',
      projectId: project1.id,
      name: 'ACME Logo Redesign',
      productCategory: 'MARKETING',
      productType: 'LOGO',
      status: 'DONE',
      pmId: designer.id,
    },
  });
  const prod3 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000028',
      projectId: project1.id,
      name: 'SEO Package',
      productCategory: 'MARKETING',
      productType: 'SEO',
      status: 'CREATING',
      pmId: pm.id,
    },
  });

  // Project 2: TechStart — 2 products
  const prod4 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000022',
      projectId: project2.id,
      name: 'TechStart iOS/Android App',
      productCategory: 'CODE',
      productType: 'MOBILE_APP',
      status: 'CREATING',
      pmId: pm.id,
      deadline: new Date('2026-08-01'),
    },
  });
  const prod5 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000029',
      projectId: project2.id,
      name: 'TechStart Landing Page',
      productCategory: 'CODE',
      productType: 'LANDING',
      status: 'DONE',
      pmId: pm.id,
    },
  });

  // Project 3: GlobalCorp CRM — 2 products
  const prod6 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000023',
      projectId: project3.id,
      name: 'GlobalCorp CRM',
      productCategory: 'CODE',
      productType: 'CRM',
      status: 'NEW',
      pmId: pm2.id,
      deadline: new Date('2026-12-01'),
    },
  });
  const prod7 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000030',
      projectId: project3.id,
      name: 'CRM Branding Kit',
      productCategory: 'MARKETING',
      productType: 'BRANDING',
      status: 'DEVELOPMENT',
      pmId: designer.id,
    },
  });

  // Project 4: MedTech — 3 products
  const prod8 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000024',
      projectId: project4.id,
      name: 'Patient Portal Web App',
      productCategory: 'CODE',
      productType: 'WEB_APP',
      status: 'DEVELOPMENT',
      pmId: pm.id,
      deadline: new Date('2026-09-30'),
    },
  });
  const prod9 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000025',
      projectId: project4.id,
      name: 'MedTech WordPress Blog',
      productCategory: 'WORDPRESS',
      productType: 'COMPANY_WEBSITE',
      status: 'QA',
      pmId: pm.id,
    },
  });
  const prod10 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000031',
      projectId: project4.id,
      name: 'MedTech Logo & Design',
      productCategory: 'MARKETING',
      productType: 'DESIGN',
      status: 'DONE',
      pmId: designer.id,
    },
  });

  // Project 5: Logistics Pro — 2 products
  const prod11 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000026',
      projectId: project5.id,
      name: 'Fleet Dashboard',
      productCategory: 'CODE',
      productType: 'WEB_APP',
      status: 'CREATING',
      pmId: pm2.id,
      deadline: new Date('2026-07-15'),
    },
  });
  const prod12 = await prisma.product.create({
    data: {
      id: '00000000-0000-0000-0000-000000000027',
      projectId: project5.id,
      name: 'Logistics Shopify Store',
      productCategory: 'SHOPIFY',
      productType: 'ECOMMERCE',
      status: 'NEW',
      pmId: pm2.id,
    },
  });

  console.log('  ✓ Products (12)');

  // ── Extensions ─────────────────────────────────────────────
  const ext1 = await prisma.extension.create({
    data: {
      projectId: project1.id,
      productId: prod1.id,
      name: 'Blog module',
      size: 'MEDIUM',
      status: 'DEVELOPMENT',
      assignedTo: dev.id,
    },
  });
  await prisma.extension.create({
    data: {
      projectId: project1.id,
      productId: prod1.id,
      name: 'Multi-language support',
      size: 'SMALL',
      status: 'NEW',
    },
  });
  await prisma.extension.create({
    data: {
      projectId: project2.id,
      productId: prod4.id,
      name: 'Push notifications',
      size: 'MICRO',
      status: 'DONE',
      assignedTo: dev.id,
    },
  });
  await prisma.extension.create({
    data: {
      projectId: project2.id,
      productId: prod4.id,
      name: 'Offline mode',
      size: 'LARGE',
      status: 'NEW',
    },
  });
  await prisma.extension.create({
    data: {
      projectId: project4.id,
      productId: prod8.id,
      name: 'Appointment scheduling',
      size: 'MEDIUM',
      status: 'DEVELOPMENT',
      assignedTo: dev.id,
    },
  });
  console.log('  ✓ Extensions (5)');

  // ── Leads ──────────────────────────────────────────────────
  await prisma.lead.upsert({
    where: { code: 'L-2026-0001' },
    update: {},
    create: {
      code: 'L-2026-0001',
      contactName: 'David Abrahamyan',
      phone: '+37491234567',
      email: 'david@acme.am',
      source: 'MARKETING',
      status: 'SQL',
      contactId: contact1.id,
      assignedTo: seller.id,
    },
  });
  await prisma.lead.upsert({
    where: { code: 'L-2026-0002' },
    update: {},
    create: {
      code: 'L-2026-0002',
      contactName: 'Maria Gevorgyan',
      phone: '+37493456789',
      source: 'MARKETING',
      status: 'MQL',
      assignedTo: seller.id,
    },
  });
  await prisma.lead.upsert({
    where: { code: 'L-2026-0003' },
    update: {},
    create: {
      code: 'L-2026-0003',
      contactName: 'Tigran Hovhannisyan',
      phone: '+37499887766',
      source: 'SALES',
      status: 'NEW',
    },
  });
  await prisma.lead.upsert({
    where: { code: 'L-2026-0004' },
    update: {},
    create: {
      code: 'L-2026-0004',
      contactName: 'Liana Minasyan',
      email: 'liana@startup.am',
      source: 'CLIENT',
      status: 'CONTACT_ESTABLISHED',
      assignedTo: seller.id,
    },
  });
  await prisma.lead.upsert({
    where: { code: 'L-2026-0005' },
    update: {},
    create: {
      code: 'L-2026-0005',
      contactName: 'Anahit Martirosyan',
      phone: '+37477123456',
      email: 'anahit@medtech.am',
      source: 'MARKETING',
      status: 'SQL',
      contactId: contact5.id,
      assignedTo: seller.id,
    },
  });
  await prisma.lead.upsert({
    where: { code: 'L-2026-0006' },
    update: {},
    create: {
      code: 'L-2026-0006',
      contactName: 'Vardan Stepanyan',
      phone: '+37455998877',
      email: 'vardan@logistics.am',
      source: 'PARTNER',
      status: 'MQL',
      contactId: contact6.id,
      assignedTo: seller.id,
    },
  });
  const lead1 = await prisma.lead.findUniqueOrThrow({ where: { code: 'L-2026-0001' } });
  const lead5 = await prisma.lead.findUniqueOrThrow({ where: { code: 'L-2026-0005' } });
  const lead6 = await prisma.lead.findUniqueOrThrow({ where: { code: 'L-2026-0006' } });
  console.log('  ✓ Leads (6)');

  // ── Deals (10 — several WON with projects/products) ────────

  // D-0001: WON → Project 1, Product: Corporate Website
  const deal1 = await prisma.deal.create({
    data: {
      code: 'D-2026-0001',
      leadId: lead1.id,
      contactId: contact1.id,
      companyId: company1.id,
      type: 'PRODUCT',
      status: 'WON',
      amount: 2500000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      source: 'MARKETING',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      pmId: pm.id,
      deadline: new Date('2026-06-15'),
      projectId: project1.id,
    },
  });

  // D-0002: WON → Project 1, Product: Logo Redesign
  const deal2 = await prisma.deal.create({
    data: {
      code: 'D-2026-0002',
      contactId: contact1.id,
      companyId: company1.id,
      type: 'PRODUCT',
      status: 'WON',
      amount: 300000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      source: 'MARKETING',
      productCategory: 'MARKETING',
      productType: 'LOGO',
      pmId: designer.id,
      projectId: project1.id,
    },
  });

  // D-0003: WON → Project 2, Product: Mobile App
  const deal3 = await prisma.deal.create({
    data: {
      code: 'D-2026-0003',
      contactId: contact2.id,
      companyId: company2.id,
      type: 'PRODUCT',
      status: 'WON',
      amount: 3500000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      source: 'MARKETING',
      productCategory: 'CODE',
      productType: 'MOBILE_APP',
      pmId: pm.id,
      deadline: new Date('2026-08-01'),
      projectId: project2.id,
    },
  });

  // D-0004: WON → Project 2, Product: Landing Page
  await prisma.deal.create({
    data: {
      code: 'D-2026-0004',
      contactId: contact2.id,
      companyId: company2.id,
      type: 'PRODUCT',
      status: 'WON',
      amount: 400000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      productCategory: 'CODE',
      productType: 'LANDING',
      pmId: pm.id,
      projectId: project2.id,
    },
  });

  // D-0005: WON → Project 3, Product: CRM
  const deal5 = await prisma.deal.create({
    data: {
      code: 'D-2026-0005',
      contactId: contact3.id,
      type: 'PRODUCT',
      status: 'WON',
      amount: 8000000,
      paymentType: 'SUBSCRIPTION',
      sellerId: ceo.id,
      productCategory: 'CODE',
      productType: 'CRM',
      pmId: pm2.id,
      deadline: new Date('2026-12-01'),
      projectId: project3.id,
    },
  });

  // D-0006: WON → Project 4, Product: Web App (Patient Portal)
  const deal6 = await prisma.deal.create({
    data: {
      code: 'D-2026-0006',
      leadId: lead5.id,
      contactId: contact5.id,
      companyId: company3.id,
      type: 'PRODUCT',
      status: 'WON',
      amount: 1800000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      source: 'MARKETING',
      productCategory: 'CODE',
      productType: 'WEB_APP',
      pmId: pm.id,
      deadline: new Date('2026-09-30'),
      projectId: project4.id,
    },
  });

  // D-0007: WON → Project 5, Product: Fleet Dashboard
  const deal7 = await prisma.deal.create({
    data: {
      code: 'D-2026-0007',
      leadId: lead6.id,
      contactId: contact6.id,
      companyId: company4.id,
      type: 'PRODUCT',
      status: 'WON',
      amount: 2200000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      source: 'PARTNER',
      productCategory: 'CODE',
      productType: 'WEB_APP',
      pmId: pm2.id,
      deadline: new Date('2026-07-15'),
      projectId: project5.id,
    },
  });

  // D-0008: EXTENSION deal (in-progress) for ACME Corporate Website
  await prisma.deal.create({
    data: {
      code: 'D-2026-0008',
      contactId: contact1.id,
      companyId: company1.id,
      type: 'EXTENSION',
      status: 'SEND_OFFER',
      amount: 500000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      existingProductId: prod1.id,
    },
  });

  // D-0009: MAINTENANCE deal (in-progress)
  await prisma.deal.create({
    data: {
      code: 'D-2026-0009',
      contactId: contact3.id,
      type: 'MAINTENANCE',
      status: 'DEPOSIT_AND_CONTRACT',
      amount: 150000,
      paymentType: 'SUBSCRIPTION',
      sellerId: ceo.id,
    },
  });

  // D-0010: OUTSOURCE deal (in-progress)
  await prisma.deal.create({
    data: {
      code: 'D-2026-0010',
      contactId: contact5.id,
      companyId: company3.id,
      type: 'OUTSOURCE',
      status: 'GET_ANSWER',
      amount: 400000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      productCategory: 'MARKETING',
      productType: 'SEO',
    },
  });

  console.log('  ✓ Deals (10 — 7 WON, 3 in progress)');

  // ── Orders (8 — linked to products/deals/projects) ────────

  const order1 = await prisma.order.create({
    data: {
      code: 'ORD-2026-0001',
      projectId: project1.id,
      dealId: deal1.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: 2500000,
      status: 'PARTIALLY_PAID',
      productId: prod1.id,
    },
  });
  const order2 = await prisma.order.create({
    data: {
      code: 'ORD-2026-0002',
      projectId: project1.id,
      dealId: deal2.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: 300000,
      status: 'FULLY_PAID',
      productId: prod2.id,
    },
  });
  const order3 = await prisma.order.create({
    data: {
      code: 'ORD-2026-0003',
      projectId: project2.id,
      dealId: deal3.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: 3500000,
      status: 'ACTIVE',
      productId: prod4.id,
    },
  });
  const order4 = await prisma.order.create({
    data: {
      code: 'ORD-2026-0004',
      projectId: project3.id,
      dealId: deal5.id,
      type: 'PRODUCT',
      paymentType: 'SUBSCRIPTION',
      totalAmount: 8000000,
      status: 'ACTIVE',
      productId: prod6.id,
    },
  });
  const order5 = await prisma.order.create({
    data: {
      code: 'ORD-2026-0005',
      projectId: project4.id,
      dealId: deal6.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: 1800000,
      status: 'PARTIALLY_PAID',
      productId: prod8.id,
    },
  });
  const order6 = await prisma.order.create({
    data: {
      code: 'ORD-2026-0006',
      projectId: project5.id,
      dealId: deal7.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: 2200000,
      status: 'ACTIVE',
      productId: prod11.id,
    },
  });
  const order7 = await prisma.order.create({
    data: {
      code: 'ORD-2026-0007',
      projectId: project1.id,
      type: 'EXTENSION',
      paymentType: 'CLASSIC',
      totalAmount: 450000,
      status: 'ACTIVE',
      extensionId: ext1.id,
      partnerId: partner1.id,
      partnerPercent: 25,
    },
  });
  await prisma.order.create({
    data: {
      code: 'ORD-2026-0008',
      projectId: project1.id,
      type: 'MAINTENANCE',
      paymentType: 'SUBSCRIPTION',
      totalAmount: 150000,
      currency: 'AMD',
      status: 'ACTIVE',
    },
  });

  console.log('  ✓ Orders (8)');

  // ── Invoices & Payments ────────────────────────────────────
  const inv1 = await prisma.invoice.create({
    data: {
      code: 'INV-2026-0001',
      orderId: order1.id,
      projectId: project1.id,
      companyId: company1.id,
      amount: 1250000,
      type: 'DEVELOPMENT',
      status: 'PAID',
      paidDate: new Date('2026-02-15'),
    },
  });
  const inv2 = await prisma.invoice.create({
    data: {
      code: 'INV-2026-0002',
      orderId: order1.id,
      projectId: project1.id,
      companyId: company1.id,
      amount: 1250000,
      type: 'DEVELOPMENT',
      status: 'WAITING',
      dueDate: new Date('2026-04-01'),
    },
  });
  await prisma.invoice.create({
    data: {
      code: 'INV-2026-0003',
      orderId: order2.id,
      projectId: project1.id,
      companyId: company1.id,
      amount: 300000,
      type: 'DEVELOPMENT',
      status: 'PAID',
      paidDate: new Date('2026-01-20'),
    },
  });
  await prisma.invoice.create({
    data: {
      code: 'INV-2026-0004',
      orderId: order3.id,
      projectId: project2.id,
      companyId: company2.id,
      amount: 1050000,
      type: 'DEVELOPMENT',
      status: 'THIS_MONTH',
      dueDate: new Date('2026-04-15'),
      taxStatus: 'TAX_FREE',
    },
  });
  await prisma.invoice.create({
    data: {
      code: 'INV-2026-0005',
      orderId: order5.id,
      projectId: project4.id,
      companyId: company3.id,
      amount: 900000,
      type: 'DEVELOPMENT',
      status: 'PAID',
      paidDate: new Date('2026-03-01'),
    },
  });
  await prisma.invoice.create({
    data: {
      code: 'INV-2026-0006',
      orderId: order5.id,
      projectId: project4.id,
      companyId: company3.id,
      amount: 900000,
      type: 'DEVELOPMENT',
      status: 'WAITING',
      dueDate: new Date('2026-06-01'),
    },
  });
  await prisma.invoice.create({
    data: {
      code: 'INV-2026-0007',
      orderId: order6.id,
      projectId: project5.id,
      companyId: company4.id,
      amount: 1100000,
      type: 'DEVELOPMENT',
      status: 'WAITING',
      dueDate: new Date('2026-05-01'),
    },
  });
  await prisma.invoice.create({
    data: {
      code: 'INV-2026-0008',
      orderId: order7.id,
      projectId: project1.id,
      companyId: company1.id,
      amount: 225000,
      type: 'EXTENSION',
      status: 'DELAYED',
      dueDate: new Date('2026-02-28'),
      taxStatus: 'TAX',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: 1250000,
      paymentDate: new Date('2026-02-15'),
      paymentMethod: 'BANK_TRANSFER',
      confirmedBy: ceo.id,
      notes: 'First 50% prepayment',
    },
  });

  console.log('  ✓ Invoices (8), Payments (1)');

  // ── Subscriptions ──────────────────────────────────────────
  const sub1 = await prisma.subscription.upsert({
    where: { code: 'SUB-2026-0001' },
    update: {},
    create: {
      code: 'SUB-2026-0001',
      projectId: project1.id,
      type: 'DEV_AND_MAINTENANCE',
      amount: 150000,
      billingDay: 1,
      startDate: new Date('2026-02-01'),
      status: 'ACTIVE',
      taxStatus: 'TAX',
    },
  });
  await prisma.subscription.upsert({
    where: { code: 'SUB-2026-0002' },
    update: {},
    create: {
      code: 'SUB-2026-0002',
      projectId: project2.id,
      type: 'MAINTENANCE_ONLY',
      amount: 80000,
      billingDay: 15,
      startDate: new Date('2026-01-15'),
      status: 'ACTIVE',
      partnerId: partner1.id,
      taxStatus: 'TAX_FREE',
    },
  });

  await prisma.invoice.create({
    data: {
      code: 'INV-2026-0009',
      subscriptionId: sub1.id,
      projectId: project1.id,
      companyId: company1.id,
      amount: 150000,
      type: 'SUBSCRIPTION',
      status: 'WAITING',
      dueDate: new Date('2026-03-10'),
      taxStatus: 'TAX',
    },
  });

  console.log('  ✓ Subscriptions (2)');

  // ── Tasks (10 — spread across products) ────────────────────
  const taskData = [
    {
      code: 'T-2026-0001',
      title: 'Design homepage layout',
      creatorId: pm.id,
      assigneeId: designer.id,
      status: 'DONE',
      priority: 'HIGH',
      productId: prod1.id,
      projectId: project1.id,
    },
    {
      code: 'T-2026-0002',
      title: 'Implement REST API endpoints',
      creatorId: pm.id,
      assigneeId: dev.id,
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      productId: prod1.id,
      projectId: project1.id,
    },
    {
      code: 'T-2026-0003',
      title: 'Setup CI/CD pipeline',
      creatorId: ceo.id,
      assigneeId: dev.id,
      status: 'NEW',
      priority: 'NORMAL',
      productId: prod1.id,
      projectId: project1.id,
    },
    {
      code: 'T-2026-0004',
      title: 'Create mobile app wireframes',
      creatorId: pm.id,
      assigneeId: designer.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      productId: prod4.id,
      projectId: project2.id,
    },
    {
      code: 'T-2026-0005',
      title: 'Build landing page',
      creatorId: pm.id,
      assigneeId: dev.id,
      status: 'DONE',
      priority: 'NORMAL',
      productId: prod5.id,
      projectId: project2.id,
    },
    {
      code: 'T-2026-0006',
      title: 'CRM database schema design',
      creatorId: pm2.id,
      assigneeId: dev.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      productId: prod6.id,
      projectId: project3.id,
    },
    {
      code: 'T-2026-0007',
      title: 'Patient portal authentication',
      creatorId: pm.id,
      assigneeId: dev.id,
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      productId: prod8.id,
      projectId: project4.id,
    },
    {
      code: 'T-2026-0008',
      title: 'WordPress blog setup',
      creatorId: pm.id,
      assigneeId: dev.id,
      status: 'DONE',
      priority: 'NORMAL',
      productId: prod9.id,
      projectId: project4.id,
    },
    {
      code: 'T-2026-0009',
      title: 'Fleet dashboard map integration',
      creatorId: pm2.id,
      assigneeId: dev.id,
      status: 'NEW',
      priority: 'HIGH',
      productId: prod11.id,
      projectId: project5.id,
    },
    {
      code: 'T-2026-0010',
      title: 'SEO audit report',
      creatorId: pm.id,
      assigneeId: designer.id,
      status: 'NEW',
      priority: 'LOW',
      productId: prod3.id,
      projectId: project1.id,
    },
  ] as const;

  for (const t of taskData) {
    const task = await prisma.task.upsert({
      where: { code: t.code },
      update: {},
      create: {
        code: t.code,
        title: t.title,
        creatorId: t.creatorId,
        assigneeId: t.assigneeId,
        status: t.status,
        priority: t.priority,
        productId: t.productId,
      },
    });
    await prisma.taskLink.upsert({
      where: {
        taskId_entityType_entityId: {
          taskId: task.id,
          entityType: 'PROJECT',
          entityId: t.projectId,
        },
      },
      update: {},
      create: { taskId: task.id, entityType: 'PROJECT', entityId: t.projectId },
    });
    await prisma.taskLink.upsert({
      where: {
        taskId_entityType_entityId: {
          taskId: task.id,
          entityType: 'PRODUCT',
          entityId: t.productId,
        },
      },
      update: {},
      create: { taskId: task.id, entityType: 'PRODUCT', entityId: t.productId },
    });
  }
  console.log('  ✓ Tasks (10)');

  // ── Support Tickets (5) ────────────────────────────────────
  await prisma.supportTicket.create({
    data: {
      code: 'TKT-2026-0001',
      projectId: project1.id,
      productId: prod1.id,
      contactId: contact1.id,
      category: 'INCIDENT',
      priority: 'P2',
      status: 'IN_PROGRESS',
      title: 'Contact form not sending emails',
      description: 'Users report that the contact form submissions are not being delivered.',
      assignedTo: dev.id,
    },
  });
  await prisma.supportTicket.create({
    data: {
      code: 'TKT-2026-0002',
      projectId: project1.id,
      contactId: contact1.id,
      category: 'CHANGE_REQUEST',
      priority: 'P3',
      status: 'NEW',
      title: 'Add blog section to website',
      description: 'Client wants to add a blog to the corporate website.',
      billable: true,
    },
  });
  await prisma.supportTicket.create({
    data: {
      code: 'TKT-2026-0003',
      projectId: project2.id,
      productId: prod4.id,
      contactId: contact2.id,
      category: 'SERVICE_REQUEST',
      priority: 'P1',
      status: 'ASSIGNED',
      title: 'Need new admin account',
      description: 'Client requested additional admin user for the app.',
      assignedTo: pm.id,
    },
  });
  await prisma.supportTicket.create({
    data: {
      code: 'TKT-2026-0004',
      projectId: project4.id,
      productId: prod8.id,
      category: 'PROBLEM',
      priority: 'P2',
      status: 'IN_PROGRESS',
      title: 'Slow page load on patient list',
      description: 'Patient list takes 5s to load with 1000+ records.',
      assignedTo: dev.id,
    },
  });
  await prisma.supportTicket.create({
    data: {
      code: 'TKT-2026-0005',
      projectId: project5.id,
      productId: prod11.id,
      contactId: contact6.id,
      category: 'CHANGE_REQUEST',
      priority: 'P3',
      status: 'NEW',
      title: 'Add driver GPS tracking',
      description: 'Client wants real-time GPS tracking of fleet vehicles.',
    },
  });
  console.log('  ✓ Support Tickets (5)');

  // ── Expenses ───────────────────────────────────────────────
  await prisma.expense.create({
    data: {
      type: 'PLANNED',
      category: 'HOSTING',
      name: 'Vercel Pro — ACME Website',
      amount: 20000,
      frequency: 'MONTHLY',
      status: 'PAID',
      projectId: project1.id,
      isPassThrough: true,
      taxStatus: 'TAX_FREE',
    },
  });
  await prisma.expense.create({
    data: {
      type: 'PLANNED',
      category: 'DOMAIN',
      name: 'acme.am domain renewal',
      amount: 15000,
      frequency: 'YEARLY',
      status: 'THIS_MONTH',
      projectId: project1.id,
      isPassThrough: true,
    },
  });
  await prisma.expense.create({
    data: {
      type: 'PLANNED',
      category: 'TOOLS',
      name: 'Figma Team plan',
      amount: 72000,
      frequency: 'YEARLY',
      status: 'PAID',
      taxStatus: 'TAX_FREE',
    },
  });
  await prisma.expense.create({
    data: {
      type: 'PLANNED',
      category: 'HOSTING',
      name: 'Firebase — TechStart App',
      amount: 15000,
      frequency: 'MONTHLY',
      status: 'PAID',
      projectId: project2.id,
      isPassThrough: true,
    },
  });
  await prisma.expense.create({
    data: {
      type: 'PLANNED',
      category: 'SERVICE',
      name: 'Neon DB — MedTech',
      amount: 8000,
      frequency: 'MONTHLY',
      status: 'PAID',
      projectId: project4.id,
    },
  });
  console.log('  ✓ Expenses (5)');

  // ── Bonus entries ──────────────────────────────────────────
  await prisma.bonusEntry.create({
    data: {
      employeeId: seller.id,
      orderId: order1.id,
      projectId: project1.id,
      type: 'SALES',
      amount: 75000,
      percent: 3,
      status: 'EARNED',
      kpiGatePassed: true,
      holdbackPercent: 20,
      holdbackReleaseDate: new Date('2026-05-01'),
      payoutMonth: new Date('2026-04-01'),
    },
  });
  await prisma.bonusEntry.create({
    data: {
      employeeId: pm.id,
      orderId: order1.id,
      projectId: project1.id,
      type: 'DELIVERY',
      amount: 50000,
      percent: 2,
      status: 'INCOMING',
      kpiGatePassed: null,
    },
  });
  await prisma.bonusEntry.create({
    data: {
      employeeId: seller.id,
      orderId: order3.id,
      projectId: project2.id,
      type: 'SALES',
      amount: 105000,
      percent: 3,
      status: 'PENDING_ELIGIBILITY',
      kpiGatePassed: null,
    },
  });
  console.log('  ✓ Bonus entries (3)');

  // ── Credentials ────────────────────────────────────────────
  await prisma.credential.create({
    data: {
      projectId: project1.id,
      category: 'ADMIN',
      provider: 'Vercel',
      name: 'ACME Production Admin',
      url: 'https://vercel.com/acme',
      login: 'admin@acme.am',
      accessLevel: 'PROJECT_TEAM',
      allowedEmployees: [pm.id, dev.id],
    },
  });
  await prisma.credential.create({
    data: {
      projectId: project1.id,
      category: 'DOMAIN',
      provider: 'Namecheap',
      name: 'acme.am DNS',
      url: 'https://ap.manage.namecheap.com',
      login: 'acme_account',
      accessLevel: 'SECRET',
      allowedEmployees: [pm.id],
    },
  });
  await prisma.credential.create({
    data: {
      projectId: project2.id,
      category: 'API_KEY',
      provider: 'Firebase',
      name: 'TechStart App Firebase',
      accessLevel: 'PROJECT_TEAM',
      allowedEmployees: [pm.id, dev.id],
    },
  });
  await prisma.credential.create({
    data: {
      projectId: project4.id,
      category: 'ADMIN',
      provider: 'Neon',
      name: 'MedTech DB Admin',
      url: 'https://console.neon.tech',
      login: 'medtech_admin',
      accessLevel: 'SECRET',
      allowedEmployees: [pm.id],
    },
  });
  await prisma.credential.create({
    data: {
      projectId: project5.id,
      category: 'API_KEY',
      provider: 'Google Maps',
      name: 'Fleet Maps API Key',
      accessLevel: 'PROJECT_TEAM',
      allowedEmployees: [pm2.id, dev.id],
    },
  });
  await prisma.credential.create({
    data: {
      category: 'SERVICE',
      provider: 'Figma',
      name: 'Figma Team',
      url: 'https://figma.com',
      accessLevel: 'DEPARTMENT',
      allowedEmployees: [],
    },
  });
  console.log('  ✓ Credentials (6)');

  // ── Domains ────────────────────────────────────────────────
  await prisma.domain.upsert({
    where: { domainName: 'acme.am' },
    update: {},
    create: {
      projectId: project1.id,
      domainName: 'acme.am',
      provider: 'Namecheap',
      purchaseDate: new Date('2024-03-01'),
      expiryDate: new Date('2026-03-01'),
      renewalCost: 15000,
      clientCharge: 20000,
      autoRenew: true,
      status: 'ACTIVE',
    },
  });
  await prisma.domain.upsert({
    where: { domainName: 'techstart-app.com' },
    update: {},
    create: {
      projectId: project2.id,
      domainName: 'techstart-app.com',
      provider: 'Cloudflare',
      purchaseDate: new Date('2025-06-01'),
      expiryDate: new Date('2026-06-01'),
      renewalCost: 12000,
      status: 'EXPIRING_SOON',
    },
  });
  await prisma.domain.upsert({
    where: { domainName: 'medtech-portal.am' },
    update: {},
    create: {
      projectId: project4.id,
      domainName: 'medtech-portal.am',
      provider: 'Namecheap',
      purchaseDate: new Date('2026-01-10'),
      expiryDate: new Date('2027-01-10'),
      renewalCost: 10000,
      autoRenew: true,
      status: 'ACTIVE',
    },
  });
  await prisma.domain.upsert({
    where: { domainName: 'logistics-pro.am' },
    update: {},
    create: {
      projectId: project5.id,
      domainName: 'logistics-pro.am',
      provider: 'Namecheap',
      purchaseDate: new Date('2026-02-01'),
      expiryDate: new Date('2027-02-01'),
      renewalCost: 10000,
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Domains (4)');

  // ── Audit logs ─────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      projectId: project1.id,
      entityType: 'Task',
      entityId: prod1.id,
      action: 'STATUS_CHANGE',
      userId: pm.id,
      changes: { from: 'TODO', to: 'IN_PROGRESS' },
      ipAddress: '127.0.0.1',
    },
  });
  await prisma.auditLog.create({
    data: {
      projectId: project1.id,
      entityType: 'Invoice',
      entityId: inv2.id,
      action: 'CREATED',
      userId: ceo.id,
      ipAddress: '127.0.0.1',
    },
  });
  console.log('  ✓ Audit logs (2)');

  // ── System list options ────────────────────────────────────
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
  await prisma.systemListOption.createMany({ data: systemListOptions });
  console.log('  ✓ System list options (21)');

  console.log('\n✅ Seed completed successfully!');
  console.log('   5 projects, 12 products, 5 extensions');
  console.log('   10 deals (7 WON), 8 orders, 9 invoices');
  console.log('   10 tasks, 5 tickets, 6 credentials');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
