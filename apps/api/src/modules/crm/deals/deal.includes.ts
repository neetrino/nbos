const userSummarySelect = { id: true, firstName: true, lastName: true } as const;
const companySummarySelect = { id: true, name: true } as const;
const productSummarySelect = { id: true, name: true, productType: true, status: true } as const;

export const dealListInclude = {
  lead: { select: { id: true, code: true, contactName: true } },
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  company: { select: companySummarySelect },
  seller: { select: userSummarySelect },
  pm: { select: userSummarySelect },
  orders: {
    select: {
      id: true,
      code: true,
      status: true,
      totalAmount: true,
      projectId: true,
      invoices: {
        select: {
          id: true,
          code: true,
          status: true,
          amount: true,
          payments: { select: { id: true, amount: true } },
        },
      },
    },
  },
  existingProduct: { select: productSummarySelect },
  sourcePartner: { select: companySummarySelect },
  sourceContact: { select: { id: true, firstName: true, lastName: true } },
  marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
  marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
} as const;

export const dealDetailInclude = {
  ...dealListInclude,
  lead: true,
  contact: true,
  orders: {
    include: {
      invoices: {
        select: {
          id: true,
          code: true,
          status: true,
          amount: true,
          paidDate: true,
          payments: { select: { id: true, amount: true, paymentDate: true } },
        },
      },
    },
  },
} as const;

export const dealCreateInclude = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  seller: { select: userSummarySelect },
  marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
  marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
} as const;

export const dealUpdateInclude = {
  ...dealListInclude,
  orders: {
    select: {
      id: true,
      code: true,
      status: true,
      totalAmount: true,
      projectId: true,
      invoices: {
        select: {
          id: true,
          code: true,
          status: true,
          amount: true,
          paidDate: true,
          payments: { select: { id: true, amount: true } },
        },
      },
    },
  },
} as const;
