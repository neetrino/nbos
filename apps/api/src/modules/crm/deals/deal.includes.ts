import { employeePersonSelect } from '../../../common/employee-person.select';

const companySummarySelect = { id: true, name: true } as const;
const productSummarySelect = { id: true, name: true, productType: true, status: true } as const;
const partnerSummarySelect = { id: true, name: true, defaultPercent: true } as const;
const contactSummarySelect = { id: true, firstName: true, lastName: true, email: true } as const;

export const dealAdditionalContactsInclude = {
  additionalContacts: {
    include: { contact: { select: contactSummarySelect } },
  },
} as const;

export const partnerReferralTermsSelect = {
  id: true,
  partnerPercent: true,
  sourcePolicy: true,
  overrideReason: true,
  dealType: true,
  paymentType: true,
  updatedAt: true,
} as const;

export const dealOrderSelect = {
  id: true,
  code: true,
  status: true,
  totalAmount: true,
  projectId: true,
  productId: true,
  paymentMode: true,
  deliveryStartMode: true,
  invoices: {
    select: {
      id: true,
      code: true,
      moneyStatus: true,
      amount: true,
      subscriptionId: true,
      payments: { select: { id: true, amount: true } },
    },
  },
} as const;

export const dealCommercialRelationsInclude = {
  exceptionApprovedBy: { select: employeePersonSelect },
} as const;

export const dealListInclude = {
  lead: { select: { id: true, code: true, contactName: true } },
  contact: { select: contactSummarySelect },
  company: { select: companySummarySelect },
  seller: { select: employeePersonSelect },
  sellerAssistant: { select: employeePersonSelect },
  pm: { select: employeePersonSelect },
  ...dealCommercialRelationsInclude,
  orders: {
    select: dealOrderSelect,
  },
  existingProduct: { select: productSummarySelect },
  sourcePartner: { select: partnerSummarySelect },
  sourceContact: { select: { id: true, firstName: true, lastName: true } },
  marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
  marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
  partnerReferralTerms: { select: partnerReferralTermsSelect },
  ...dealAdditionalContactsInclude,
} as const;

const dealWhatsAppBindingSelect = {
  id: true,
  groupChatId: true,
  groupName: true,
  status: true,
  lastErrorCode: true,
  lastErrorMessage: true,
} as const;

export const dealDetailInclude = {
  ...dealListInclude,
  whatsappGroupBinding: { select: dealWhatsAppBindingSelect },
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
          subscriptionId: true,
          payments: { select: { id: true, amount: true, paymentDate: true } },
        },
      },
    },
  },
} as const;

export const dealCreateInclude = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  seller: { select: employeePersonSelect },
  sellerAssistant: { select: employeePersonSelect },
  marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
  marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
  partnerReferralTerms: { select: partnerReferralTermsSelect },
} as const;

export const dealUpdateInclude = {
  ...dealListInclude,
  orders: {
    select: {
      ...dealOrderSelect,
      invoices: {
        select: {
          id: true,
          code: true,
          moneyStatus: true,
          amount: true,
          paidDate: true,
          subscriptionId: true,
          payments: { select: { id: true, amount: true } },
        },
      },
    },
  },
} as const;
