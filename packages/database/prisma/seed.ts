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

  // Employees (roleId references roles seeded in migration — NOT deleted)
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

  console.log('  ✓ Employees (5)');

  // Contacts
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

  console.log('  ✓ Contacts (6)');

  // Companies
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

  const partnerContact = await prisma.contact.upsert({
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

  // Partners
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
      contactId: partnerContact.id,
    },
  });

  await prisma.partner.upsert({
    where: { id: '00000000-0000-0000-0000-000000000031' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000031',
      name: 'Startup Hub',
      type: 'REGULAR',
      direction: 'BOTH',
      defaultPercent: 30,
      status: 'ACTIVE',
    },
  });

  console.log('  ✓ Partners (2)');

  // Projects
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
      description: 'Full corporate website with CMS',
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
      pmId: pm.id,
      description: 'White-label CRM for enterprise client',
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

  const company5 = await prisma.company.upsert({
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

  const company6 = await prisma.company.upsert({
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

  const project4 = await prisma.project.upsert({
    where: { code: 'P-2026-0004' },
    update: {},
    create: {
      code: 'P-2026-0004',
      name: 'MedTech Patient Portal',
      type: 'CUSTOM_CODE',
      contactId: contact5.id,
      companyId: company5.id,
      sellerId: seller.id,
      pmId: pm.id,
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
      companyId: company6.id,
      sellerId: seller.id,
      pmId: pm.id,
      description: 'Fleet and delivery management dashboard',
    },
  });

  console.log('  ✓ Projects (5)');

  // Products
  await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      projectId: project1.id,
      name: 'Corporate Website',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      status: 'DEVELOPMENT',
      pmId: pm.id,
    },
  });

  await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000021' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000021',
      projectId: project1.id,
      name: 'ACME Logo Redesign',
      productCategory: 'MARKETING',
      productType: 'LOGO',
      status: 'DONE',
      pmId: designer.id,
    },
  });

  await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000022' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000022',
      projectId: project2.id,
      name: 'TechStart iOS/Android App',
      productCategory: 'CODE',
      productType: 'MOBILE_APP',
      status: 'CREATING',
      pmId: pm.id,
    },
  });

  await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000023' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000023',
      projectId: project3.id,
      name: 'GlobalCorp CRM',
      productCategory: 'CODE',
      productType: 'CRM',
      status: 'NEW',
      pmId: pm.id,
    },
  });

  const ext1 = await prisma.extension.create({
    data: {
      projectId: project1.id,
      productId: '00000000-0000-0000-0000-000000000020',
      name: 'Blog module',
      size: 'MEDIUM',
      status: 'DEVELOPMENT',
      assignedTo: dev.id,
    },
  });

  const ext2 = await prisma.extension.create({
    data: {
      projectId: project1.id,
      productId: '00000000-0000-0000-0000-000000000020',
      name: 'Multi-language support',
      size: 'SMALL',
      status: 'NEW',
      assignedTo: undefined,
    },
  });

  await prisma.extension.create({
    data: {
      projectId: project2.id,
      productId: '00000000-0000-0000-0000-000000000022',
      name: 'Push notifications',
      size: 'MICRO',
      status: 'DONE',
      assignedTo: dev.id,
    },
  });

  await prisma.extension.create({
    data: {
      projectId: project2.id,
      productId: '00000000-0000-0000-0000-000000000022',
      name: 'Offline mode',
      size: 'LARGE',
      status: 'NEW',
    },
  });

  console.log('  ✓ Extensions (4)');

  // Leads
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

  await prisma.lead.upsert({
    where: { code: 'L-2026-0007' },
    update: {},
    create: {
      code: 'L-2026-0007',
      contactName: 'Gayane Petrosyan',
      phone: '+37494112233',
      source: 'MARKETING',
      status: 'DIDNT_GET_THROUGH',
      assignedTo: seller.id,
    },
  });

  const lead1 = await prisma.lead.findUniqueOrThrow({ where: { code: 'L-2026-0001' } });
  console.log('  ✓ Leads (7)');

  // Deals
  const deal1 = await prisma.deal.upsert({
    where: { code: 'D-2026-0001' },
    update: {},
    create: {
      code: 'D-2026-0001',
      leadId: lead1.id,
      contactId: contact1.id,
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

  const deal2 = await prisma.deal.upsert({
    where: { code: 'D-2026-0002' },
    update: {},
    create: {
      code: 'D-2026-0002',
      contactId: contact2.id,
      type: 'PRODUCT',
      status: 'SEND_OFFER',
      amount: 3500000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      source: 'MARKETING',
      productCategory: 'CODE',
      productType: 'MOBILE_APP',
      pmId: pm.id,
      deadline: new Date('2026-08-01'),
      companyId: company2.id,
      projectId: project2.id,
    },
  });

  await prisma.deal.upsert({
    where: { code: 'D-2026-0003' },
    update: {},
    create: {
      code: 'D-2026-0003',
      contactId: contact3.id,
      type: 'PRODUCT',
      status: 'MEETING',
      amount: 8000000,
      paymentType: 'SUBSCRIPTION',
      sellerId: ceo.id,
      productCategory: 'CODE',
      productType: 'CRM',
    },
  });

  await prisma.deal.upsert({
    where: { code: 'D-2026-0004' },
    update: {},
    create: {
      code: 'D-2026-0004',
      contactId: contact5.id,
      type: 'PRODUCT',
      status: 'DISCUSS_NEEDS',
      amount: 1200000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      source: 'MARKETING',
      productCategory: 'CODE',
      productType: 'WEB_APP',
      companyId: company5.id,
    },
  });

  await prisma.deal.upsert({
    where: { code: 'D-2026-0005' },
    update: {},
    create: {
      code: 'D-2026-0005',
      contactId: contact6.id,
      type: 'EXTENSION',
      status: 'SEND_OFFER',
      amount: 500000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      source: 'PARTNER',
      existingProductId: '00000000-0000-0000-0000-000000000020',
      companyId: company6.id,
    },
  });

  await prisma.deal.upsert({
    where: { code: 'D-2026-0006' },
    update: {},
    create: {
      code: 'D-2026-0006',
      contactId: contact3.id,
      type: 'MAINTENANCE',
      status: 'DEPOSIT_AND_CONTRACT',
      amount: 150000,
      paymentType: 'SUBSCRIPTION',
      sellerId: ceo.id,
    },
  });

  await prisma.deal.upsert({
    where: { code: 'D-2026-0007' },
    update: {},
    create: {
      code: 'D-2026-0007',
      contactId: contact5.id,
      type: 'OUTSOURCE',
      status: 'GET_ANSWER',
      amount: 400000,
      paymentType: 'CLASSIC',
      sellerId: seller.id,
      productCategory: 'MARKETING',
      productType: 'SEO',
    },
  });

  console.log('  ✓ Deals (7)');

  // Orders
  const order1 = await prisma.order.upsert({
    where: { code: 'ORD-2026-0001' },
    update: {},
    create: {
      code: 'ORD-2026-0001',
      projectId: project1.id,
      dealId: deal1.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: 2500000,
      status: 'PARTIALLY_PAID',
      productId: '00000000-0000-0000-0000-000000000020',
    },
  });

  const order2 = await prisma.order.upsert({
    where: { code: 'ORD-2026-0002' },
    update: {},
    create: {
      code: 'ORD-2026-0002',
      projectId: project2.id,
      dealId: deal2.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: 3500000,
      status: 'ACTIVE',
      productId: '00000000-0000-0000-0000-000000000022',
    },
  });

  const order3 = await prisma.order.upsert({
    where: { code: 'ORD-2026-0003' },
    update: {},
    create: {
      code: 'ORD-2026-0003',
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

  await prisma.order.upsert({
    where: { code: 'ORD-2026-0004' },
    update: {},
    create: {
      code: 'ORD-2026-0004',
      projectId: project1.id,
      type: 'MAINTENANCE',
      paymentType: 'SUBSCRIPTION',
      totalAmount: 150000,
      currency: 'AMD',
      status: 'ACTIVE',
    },
  });

  console.log('  ✓ Orders (4)');

  // Invoices
  await prisma.invoice.upsert({
    where: { code: 'INV-2026-0001' },
    update: {},
    create: {
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

  const inv2 = await prisma.invoice.upsert({
    where: { code: 'INV-2026-0002' },
    update: {},
    create: {
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

  const inv1 = await prisma.invoice.findUniqueOrThrow({ where: { code: 'INV-2026-0001' } });
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

  // Subscriptions
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

  await prisma.invoice.upsert({
    where: { code: 'INV-2026-0003' },
    update: {},
    create: {
      code: 'INV-2026-0003',
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

  console.log('  ✓ Invoices (3), Payments (1), Subscriptions (2)');

  // Tasks (привязка к сущностям через TaskLink)
  const task1 = await prisma.task.upsert({
    where: { code: 'T-2026-0001' },
    update: {},
    create: {
      code: 'T-2026-0001',
      title: 'Design homepage layout',
      creatorId: pm.id,
      assigneeId: designer.id,
      status: 'DONE',
      priority: 'HIGH',
      productId: '00000000-0000-0000-0000-000000000020',
    },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task1.id,
        entityType: 'PROJECT',
        entityId: project1.id,
      },
    },
    update: {},
    create: { taskId: task1.id, entityType: 'PROJECT', entityId: project1.id },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task1.id,
        entityType: 'PRODUCT',
        entityId: '00000000-0000-0000-0000-000000000020',
      },
    },
    update: {},
    create: {
      taskId: task1.id,
      entityType: 'PRODUCT',
      entityId: '00000000-0000-0000-0000-000000000020',
    },
  });

  const task2 = await prisma.task.upsert({
    where: { code: 'T-2026-0002' },
    update: {},
    create: {
      code: 'T-2026-0002',
      title: 'Implement REST API endpoints',
      creatorId: pm.id,
      assigneeId: dev.id,
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      productId: '00000000-0000-0000-0000-000000000020',
    },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task2.id,
        entityType: 'PROJECT',
        entityId: project1.id,
      },
    },
    update: {},
    create: { taskId: task2.id, entityType: 'PROJECT', entityId: project1.id },
  });

  const task3 = await prisma.task.upsert({
    where: { code: 'T-2026-0003' },
    update: {},
    create: {
      code: 'T-2026-0003',
      title: 'Setup CI/CD pipeline',
      creatorId: ceo.id,
      assigneeId: dev.id,
      status: 'NEW',
      priority: 'NORMAL',
    },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task3.id,
        entityType: 'PROJECT',
        entityId: project1.id,
      },
    },
    update: {},
    create: { taskId: task3.id, entityType: 'PROJECT', entityId: project1.id },
  });

  const task4 = await prisma.task.upsert({
    where: { code: 'T-2026-0004' },
    update: {},
    create: {
      code: 'T-2026-0004',
      title: 'Create mobile app wireframes',
      creatorId: pm.id,
      assigneeId: designer.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      productId: '00000000-0000-0000-0000-000000000022',
    },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task4.id,
        entityType: 'PROJECT',
        entityId: project2.id,
      },
    },
    update: {},
    create: { taskId: task4.id, entityType: 'PROJECT', entityId: project2.id },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task4.id,
        entityType: 'PRODUCT',
        entityId: '00000000-0000-0000-0000-000000000022',
      },
    },
    update: {},
    create: {
      taskId: task4.id,
      entityType: 'PRODUCT',
      entityId: '00000000-0000-0000-0000-000000000022',
    },
  });

  console.log('  ✓ Tasks (4)');

  // Support Tickets
  await prisma.supportTicket.upsert({
    where: { code: 'TKT-2026-0001' },
    update: {},
    create: {
      code: 'TKT-2026-0001',
      projectId: project1.id,
      contactId: contact1.id,
      category: 'INCIDENT',
      priority: 'P2',
      status: 'IN_PROGRESS',
      title: 'Contact form not sending emails',
      description: 'Users report that the contact form submissions are not being delivered.',
      assignedTo: dev.id,
      productId: '00000000-0000-0000-0000-000000000020',
    },
  });

  await prisma.supportTicket.upsert({
    where: { code: 'TKT-2026-0002' },
    update: {},
    create: {
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

  console.log('  ✓ Support Tickets (2)');

  // Expenses
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

  // Bonus entries (sales/delivery from orders)
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
      orderId: order2.id,
      projectId: project2.id,
      type: 'SALES',
      amount: 105000,
      percent: 3,
      status: 'PENDING_ELIGIBILITY',
      kpiGatePassed: null,
    },
  });

  console.log('  ✓ Bonus entries (3)');

  // Credentials
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
      projectId: undefined,
      category: 'SERVICE',
      provider: 'Figma',
      name: 'Figma Team',
      url: 'https://figma.com',
      accessLevel: 'DEPARTMENT',
      allowedEmployees: [],
    },
  });

  console.log('  ✓ Credentials (4)');

  // Domains
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
    where: { domainName: 'www.acme.am' },
    update: {},
    create: {
      projectId: project1.id,
      domainName: 'www.acme.am',
      provider: 'Namecheap',
      expiryDate: new Date('2026-03-01'),
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

  console.log('  ✓ Domains (3)');

  // Extra tasks (all statuses/priorities)
  const task5 = await prisma.task.upsert({
    where: { code: 'T-2026-0005' },
    update: {},
    create: {
      code: 'T-2026-0005',
      title: 'Backlog: Research analytics',
      creatorId: pm.id,
      status: 'NEW',
      priority: 'LOW',
    },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task5.id,
        entityType: 'PROJECT',
        entityId: project3.id,
      },
    },
    update: {},
    create: { taskId: task5.id, entityType: 'PROJECT', entityId: project3.id },
  });

  const task6 = await prisma.task.upsert({
    where: { code: 'T-2026-0006' },
    update: {},
    create: {
      code: 'T-2026-0006',
      title: 'Review: Code review API',
      creatorId: pm.id,
      assigneeId: dev.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task6.id,
        entityType: 'PROJECT',
        entityId: project1.id,
      },
    },
    update: {},
    create: { taskId: task6.id, entityType: 'PROJECT', entityId: project1.id },
  });

  const task7 = await prisma.task.upsert({
    where: { code: 'T-2026-0007' },
    update: {},
    create: {
      code: 'T-2026-0007',
      title: 'Cancelled: Old feature',
      creatorId: ceo.id,
      status: 'CANCELLED',
      priority: 'NORMAL',
    },
  });
  await prisma.taskLink.upsert({
    where: {
      taskId_entityType_entityId: {
        taskId: task7.id,
        entityType: 'PROJECT',
        entityId: project1.id,
      },
    },
    update: {},
    create: { taskId: task7.id, entityType: 'PROJECT', entityId: project1.id },
  });

  console.log('  ✓ Tasks (7 total)');

  // Extra support tickets (all categories/priorities)
  await prisma.supportTicket.upsert({
    where: { code: 'TKT-2026-0003' },
    update: {},
    create: {
      code: 'TKT-2026-0003',
      projectId: project2.id,
      productId: '00000000-0000-0000-0000-000000000022',
      contactId: contact2.id,
      category: 'SERVICE_REQUEST',
      priority: 'P1',
      status: 'ASSIGNED',
      title: 'Need new admin account',
      description: 'Client requested additional admin user for the app.',
      assignedTo: pm.id,
    },
  });

  await prisma.supportTicket.upsert({
    where: { code: 'TKT-2026-0004' },
    update: {},
    create: {
      code: 'TKT-2026-0004',
      projectId: project1.id,
      category: 'PROBLEM',
      priority: 'P3',
      status: 'RESOLVED',
      title: 'Slow loading on mobile',
      description: 'Homepage loads slowly on 3G. Fixed with image optimization.',
      assignedTo: dev.id,
    },
  });

  await prisma.supportTicket.upsert({
    where: { code: 'TKT-2026-0005' },
    update: {},
    create: {
      code: 'TKT-2026-0005',
      projectId: project3.id,
      contactId: contact3.id,
      category: 'CHANGE_REQUEST',
      priority: 'P2',
      status: 'CLOSED',
      title: 'Export to Excel',
      description: 'CRM export to Excel was delivered.',
      billable: true,
    },
  });

  console.log('  ✓ Support Tickets (5 total)');

  // Extra expenses (more categories)
  await prisma.expense.create({
    data: {
      type: 'UNPLANNED',
      category: 'MARKETING',
      name: 'Facebook Ads — Q1 campaign',
      amount: 85000,
      frequency: 'ONE_TIME',
      status: 'PAID',
      taxStatus: 'TAX',
    },
  });

  await prisma.expense.create({
    data: {
      type: 'PLANNED',
      category: 'SALARY',
      name: 'Contractor — Design',
      amount: 200000,
      frequency: 'MONTHLY',
      status: 'THIS_MONTH',
      projectId: project1.id,
      taxStatus: 'TAX',
    },
  });

  await prisma.expense.create({
    data: {
      type: 'PLANNED',
      category: 'SERVICE',
      name: 'Vercel — TechStart staging',
      amount: 15000,
      frequency: 'MONTHLY',
      status: 'PAID',
      projectId: project2.id,
      isPassThrough: true,
    },
  });

  console.log('  ✓ Expenses (6 total)');

  // Extra invoices (different statuses for filters)
  await prisma.invoice.upsert({
    where: { code: 'INV-2026-0004' },
    update: {},
    create: {
      code: 'INV-2026-0004',
      projectId: project2.id,
      companyId: company2.id,
      amount: 1050000,
      type: 'DEVELOPMENT',
      status: 'THIS_MONTH',
      dueDate: new Date('2026-04-15'),
      taxStatus: 'TAX_FREE',
    },
  });

  await prisma.invoice.upsert({
    where: { code: 'INV-2026-0005' },
    update: {},
    create: {
      code: 'INV-2026-0005',
      orderId: order3.id,
      projectId: project1.id,
      companyId: company1.id,
      amount: 225000,
      type: 'EXTENSION',
      status: 'DELAYED',
      dueDate: new Date('2026-02-28'),
      taxStatus: 'TAX',
    },
  });

  console.log('  ✓ Invoices (5 total)');

  // Audit log (for activity)
  await prisma.auditLog.create({
    data: {
      projectId: project1.id,
      entityType: 'Task',
      entityId: '00000000-0000-0000-0000-000000000020',
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

  // System list options (reference data for dropdowns: Product Type, Deal Type, etc.)
  const listOptionsCount = await prisma.systemListOption.count();
  if (listOptionsCount === 0) {
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
    console.log('  ✓ System list options (Product Category + Product Type)');
  }

  console.log('\n✅ Seed completed successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
