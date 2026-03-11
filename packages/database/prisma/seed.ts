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

  console.log('  ✓ Contacts (3)');

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

  console.log('  ✓ Companies (2)');

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

  console.log('  ✓ Projects (3)');

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

  console.log('  ✓ Products (4)');

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

  console.log('  ✓ Leads (4)');

  // Deals
  await prisma.deal.upsert({
    where: { code: 'D-2026-0001' },
    update: {},
    create: {
      code: 'D-2026-0001',
      contactId: contact1.id,
      type: 'NEW_CLIENT',
      status: 'WON',
      amount: 2500000,
      paymentType: 'CLASSIC_50_50',
      sellerId: seller.id,
      source: 'WEBSITE',
    },
  });

  await prisma.deal.upsert({
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

  console.log('  ✓ Deals (3)');

  // Orders
  const order1 = await prisma.order.upsert({
    where: { code: 'ORD-2026-0001' },
    update: {},
    create: {
      code: 'ORD-2026-0001',
      projectId: project1.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC_50_50',
      totalAmount: 2500000,
      status: 'PARTIALLY_PAID',
      productId: '00000000-0000-0000-0000-000000000020',
    },
  });

  await prisma.order.upsert({
    where: { code: 'ORD-2026-0002' },
    update: {},
    create: {
      code: 'ORD-2026-0002',
      projectId: project2.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC_30_30_40',
      totalAmount: 3500000,
      status: 'ACTIVE',
      productId: '00000000-0000-0000-0000-000000000022',
    },
  });

  console.log('  ✓ Orders (2)');

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

  await prisma.invoice.upsert({
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

  console.log('  ✓ Invoices (2)');

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

  console.log('  ✓ Expenses (3)');

  console.log('\n✅ Seed completed successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
