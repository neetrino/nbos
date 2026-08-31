export const overdueReminderSelect = {
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
      name: true,
      code: true,
      productId: true,
      notificationsEnabled: true,
      reminderLanguage: true,
      product: { select: { id: true, name: true } },
    },
  },
} as const;
