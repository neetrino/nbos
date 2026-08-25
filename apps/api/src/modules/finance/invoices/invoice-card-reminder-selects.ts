export const officialRequestSelect = {
  id: true,
  code: true,
  amount: true,
  dueDate: true,
  taxStatus: true,
  moneyStatus: true,
  officialInvoiceRequestSent: true,
  notificationsEnabled: true,
  company: { select: { name: true } },
  clientServiceRecord: { select: { notificationsEnabled: true } },
} as const;

export const paymentReminderSelect = {
  id: true,
  code: true,
  amount: true,
  dueDate: true,
  coverageStartMonth: true,
  taxStatus: true,
  moneyStatus: true,
  officialInvoiceRequestSent: true,
  notificationsEnabled: true,
  company: { select: { name: true } },
  clientServiceRecord: {
    select: {
      notificationsEnabled: true,
      reminderLanguage: true,
      productId: true,
      name: true,
      product: { select: { id: true, name: true } },
    },
  },
  subscription: {
    select: {
      productId: true,
      notificationsEnabled: true,
      reminderLanguage: true,
      product: { select: { id: true, name: true } },
    },
  },
} as const;
