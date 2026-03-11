import { createPrismaClient } from '../src/client';
import type { PrismaClient as PrismaClientType } from '../src/generated/prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function main() {
  const prisma = createPrismaClient() as InstanceType<PrismaClientType>;

  console.log('Seeding database...');

  // Employees
  const ceo = await prisma.employee.upsert({
    where: { email: 'suren@neetrino.com' },
    update: {},
    create: {
      firstName: 'Suren',
      lastName: 'Babajanyan',
      email: 'suren@neetrino.com',
      role: 'CEO',
      level: 'HEAD',
      department: 'Management',
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
      role: 'SELLER',
      level: 'SENIOR',
      department: 'Sales',
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
      role: 'PM',
      level: 'SENIOR',
      department: 'Delivery',
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
      role: 'DEVELOPER',
      level: 'MIDDLE',
      department: 'Development',
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
      role: 'DESIGNER',
      level: 'MIDDLE',
      department: 'Design',
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
      productType: 'WEBSITE',
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
      status: 'IN_PROGRESS',
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

  console.log('  ✓ Extensions (3)');

  // Leads
  await prisma.lead.upsert({
    where: { code: 'L-2026-0001' },
    update: {},
    create: {
      code: 'L-2026-0001',
      contactName: 'David Abrahamyan',
      phone: '+37491234567',
      email: 'david@acme.am',
      source: 'WEBSITE',
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
      source: 'INSTAGRAM',
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
      source: 'COLD_CALL',
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
      source: 'REFERRAL',
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
      source: 'WEBSITE',
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
      source: 'FACEBOOK',
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
      type: 'NEW_CLIENT',
      status: 'WON',
      amount: 2500000,
      paymentType: 'CLASSIC_50_50',
      sellerId: seller.id,
      source: 'WEBSITE',
    },
  });

  const deal2 = await prisma.deal.upsert({
    where: { code: 'D-2026-0002' },
    update: {},
    create: {
      code: 'D-2026-0002',
      contactId: contact2.id,
      type: 'NEW_CLIENT',
      status: 'SEND_OFFER',
      amount: 3500000,
      paymentType: 'CLASSIC_30_30_40',
      sellerId: seller.id,
      source: 'INSTAGRAM',
    },
  });

  await prisma.deal.upsert({
    where: { code: 'D-2026-0003' },
    update: {},
    create: {
      code: 'D-2026-0003',
      contactId: contact3.id,
      type: 'NEW_CLIENT',
      status: 'MEETING',
      amount: 8000000,
      paymentType: 'SUBSCRIPTION',
      sellerId: ceo.id,
    },
  });

  await prisma.deal.upsert({
    where: { code: 'D-2026-0004' },
    update: {},
    create: {
      code: 'D-2026-0004',
      contactId: contact5.id,
      type: 'NEW_CLIENT',
      status: 'DISCUSS_NEEDS',
      amount: 1200000,
      paymentType: 'CLASSIC_50_50',
      sellerId: seller.id,
      source: 'WEBSITE',
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
      paymentType: 'CLASSIC_50_50',
      sellerId: seller.id,
      source: 'PARTNER',
    },
  });

  console.log('  ✓ Deals (5)');

  // Orders
  const order1 = await prisma.order.upsert({
    where: { code: 'ORD-2026-0001' },
    update: {},
    create: {
      code: 'ORD-2026-0001',
      projectId: project1.id,
      dealId: deal1.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC_50_50',
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
      paymentType: 'CLASSIC_30_30_40',
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
      paymentType: 'CLASSIC_50_50',
      totalAmount: 450000,
      status: 'ACTIVE',
      extensionId: ext1.id,
      partnerId: partner1.id,
      partnerPercent: 25,
    },
  });

  console.log('  ✓ Orders (3)');

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
      status: 'SENT',
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
      status: 'SENT',
      dueDate: new Date('2026-03-10'),
      taxStatus: 'TAX',
    },
  });

  console.log('  ✓ Invoices (3), Payments (1), Subscriptions (2)');

  // Tasks
  await prisma.task.upsert({
    where: { code: 'T-2026-0001' },
    update: {},
    create: {
      code: 'T-2026-0001',
      title: 'Design homepage layout',
      projectId: project1.id,
      productId: '00000000-0000-0000-0000-000000000020',
      creatorId: pm.id,
      assigneeId: designer.id,
      status: 'DONE',
      priority: 'HIGH',
    },
  });

  await prisma.task.upsert({
    where: { code: 'T-2026-0002' },
    update: {},
    create: {
      code: 'T-2026-0002',
      title: 'Implement REST API endpoints',
      projectId: project1.id,
      productId: '00000000-0000-0000-0000-000000000020',
      creatorId: pm.id,
      assigneeId: dev.id,
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
    },
  });

  await prisma.task.upsert({
    where: { code: 'T-2026-0003' },
    update: {},
    create: {
      code: 'T-2026-0003',
      title: 'Setup CI/CD pipeline',
      projectId: project1.id,
      creatorId: ceo.id,
      assigneeId: dev.id,
      status: 'TODO',
      priority: 'NORMAL',
    },
  });

  await prisma.task.upsert({
    where: { code: 'T-2026-0004' },
    update: {},
    create: {
      code: 'T-2026-0004',
      title: 'Create mobile app wireframes',
      projectId: project2.id,
      productId: '00000000-0000-0000-0000-000000000022',
      creatorId: pm.id,
      assigneeId: designer.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
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
  await prisma.task.upsert({
    where: { code: 'T-2026-0005' },
    update: {},
    create: {
      code: 'T-2026-0005',
      title: 'Backlog: Research analytics',
      projectId: project3.id,
      productId: '00000000-0000-0000-0000-000000000023',
      creatorId: pm.id,
      status: 'BACKLOG',
      priority: 'LOW',
    },
  });

  await prisma.task.upsert({
    where: { code: 'T-2026-0006' },
    update: {},
    create: {
      code: 'T-2026-0006',
      title: 'Review: Code review API',
      projectId: project1.id,
      productId: '00000000-0000-0000-0000-000000000020',
      creatorId: pm.id,
      assigneeId: dev.id,
      status: 'REVIEW',
      priority: 'HIGH',
    },
  });

  await prisma.task.upsert({
    where: { code: 'T-2026-0007' },
    update: {},
    create: {
      code: 'T-2026-0007',
      title: 'Cancelled: Old feature',
      projectId: project1.id,
      creatorId: ceo.id,
      status: 'CANCELLED',
      priority: 'NORMAL',
    },
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
      status: 'NEW',
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
      status: 'OVERDUE',
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

  console.log('\n✅ Seed completed successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
