import { type Prisma } from '@nbos/database';

export const projectDetailInclude = {
  company: true,
  contact: true,
  products: {
    include: {
      pm: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { extensions: true, tasks: true, tickets: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
  extensions: {
    include: {
      product: { select: { id: true, name: true, productType: true, status: true } },
      assignee: { select: { id: true, firstName: true, lastName: true } },
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
          status: true,
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
  credentials: { orderBy: { createdAt: 'desc' } },
  subscriptions: {
    include: {
      invoices: {
        select: {
          id: true,
          code: true,
          status: true,
          amount: true,
          dueDate: true,
          paidDate: true,
        },
      },
    },
    orderBy: { startDate: 'desc' },
  },
  domains: { orderBy: { expiryDate: 'asc' } },
  expenses: { orderBy: { createdAt: 'desc' } },
  auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
  _count: {
    select: {
      products: true,
      extensions: true,
      orders: true,
      tickets: true,
      credentials: true,
      expenses: true,
    },
  },
} satisfies Prisma.ProjectInclude;
