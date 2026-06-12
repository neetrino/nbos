import { type Prisma } from '@nbos/database';

const contactSummarySelect = { id: true, firstName: true, lastName: true, email: true } as const;

export const projectAdditionalContactsInclude = {
  additionalContacts: {
    include: { contact: { select: contactSummarySelect } },
  },
} as const;

export const projectDetailInclude = {
  company: true,
  contact: true,
  ...projectAdditionalContactsInclude,
  products: {
    include: {
      pm: { select: { id: true, firstName: true, lastName: true } },
      order: {
        select: {
          id: true,
          deal: { select: { id: true, code: true, name: true } },
        },
      },
      _count: { select: { extensions: true, tasks: true, tickets: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
  extensions: {
    include: {
      product: { select: { id: true, name: true, productType: true, status: true } },
      assignee: { select: { id: true, firstName: true, lastName: true } },
      order: {
        select: {
          id: true,
          deal: { select: { id: true, code: true, name: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
  orders: {
    include: {
      invoices: {
        select: {
          id: true,
          code: true,
          moneyStatus: true,
          amount: true,
          type: true,
          dueDate: true,
          paidDate: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  tickets: {
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
  credentials: {
    where: { trashedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      category: true,
      provider: true,
      url: true,
      login: true,
      phone: true,
      accessLevel: true,
      allowedEmployees: true,
      ownerId: true,
      departmentId: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  subscriptions: {
    include: {
      invoices: {
        select: {
          id: true,
          code: true,
          moneyStatus: true,
          amount: true,
          dueDate: true,
          paidDate: true,
        },
      },
    },
    orderBy: { billingStartDate: 'desc' },
  },
  domains: {
    orderBy: { expiryDate: 'asc' },
    select: {
      id: true,
      domainName: true,
      provider: true,
      purchaseDate: true,
      expiryDate: true,
      renewalCost: true,
      clientCharge: true,
      autoRenew: true,
      status: true,
      clientServiceRecordId: true,
    },
  },
  expenses: { orderBy: { createdAt: 'desc' } },
  auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
  _count: {
    select: {
      products: true,
      extensions: true,
      orders: true,
      tickets: true,
      credentials: { where: { trashedAt: null } },
      expenses: true,
    },
  },
} satisfies Prisma.ProjectInclude;
