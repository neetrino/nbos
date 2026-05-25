const contactSummarySelect = { id: true, firstName: true, lastName: true, email: true } as const;

export const leadAdditionalContactsInclude = {
  additionalContacts: {
    include: { contact: { select: contactSummarySelect } },
  },
} as const;

export const leadDetailInclude = {
  assignee: { select: { id: true, firstName: true, lastName: true } },
  sourcePartner: { select: { id: true, name: true } },
  sourceContact: { select: { id: true, firstName: true, lastName: true } },
  marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
  marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
  contact: true,
  deal: { select: { id: true, code: true, status: true } },
  ...leadAdditionalContactsInclude,
} as const;
