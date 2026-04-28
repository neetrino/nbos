import type { Prisma } from '@nbos/database';

export const ORDER_LIST_INCLUDE = {
  project: {
    select: {
      id: true,
      code: true,
      name: true,
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  deal: { select: { id: true, code: true } },
  product: { select: { id: true, name: true, productType: true } },
  extension: { select: { id: true, name: true } },
  invoices: {
    select: {
      id: true,
      code: true,
      status: true,
      amount: true,
      payments: { select: { amount: true } },
    },
  },
  _count: { select: { invoices: true } },
} satisfies Prisma.OrderInclude;

export type OrderListRow = Prisma.OrderGetPayload<{ include: typeof ORDER_LIST_INCLUDE }>;
