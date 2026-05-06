const userSummarySelect = { id: true, firstName: true, lastName: true } as const;
const companySummarySelect = { id: true, name: true } as const;
const productSummarySelect = { id: true, name: true, productType: true, status: true } as const;
const partnerSummarySelect = { id: true, name: true, defaultPercent: true } as const;

export const partnerReferralTermsSelect = {
  id: true,
  partnerPercent: true,
  sourcePolicy: true,
  overrideReason: true,
  dealType: true,
  paymentType: true,
  updatedAt: true,
} as const;

export const dealListInclude = {
  lead: { select: { id: true, code: true, contactName: true } },
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  company: { select: companySummarySelect },
  seller: { select: userSummarySelect },
  sellerAssistant: { select: userSummarySelect },
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
          moneyStatus: true,
          amount: true,
          payments: { select: { id: true, amount: true } },
        },
      },
    },
  },
  existingProduct: { select: productSummarySelect },
  sourcePartner: { select: partnerSummarySelect },
  sourceContact: { select: { id: true, firstName: true, lastName: true } },
  marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
  marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
  partnerReferralTerms: { select: partnerReferralTermsSelect },
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
          moneyStatus: true,
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
  sellerAssistant: { select: userSummarySelect },
  marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
  marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
  partnerReferralTerms: { select: partnerReferralTermsSelect },
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
          moneyStatus: true,
          amount: true,
          paidDate: true,
          payments: { select: { id: true, amount: true } },
        },
      },
    },
  },
} as const;
