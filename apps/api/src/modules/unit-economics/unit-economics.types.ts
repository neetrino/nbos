export type UnitEconomicsMoneyFields = {
  invoicedAmount: string;
  receivedAmount: string;
  receivableAmount: string;
  expensesPaidAmount: string;
  plannedBonuses: string;
  releasedBonuses: string;
  paidBonuses: string;
  remainingBonuses: string;
  cashBalance: string;
  outFactAmount: string;
  outCommittedAmount: string;
  marginFact: string;
  marginAfterCommitments: string;
  overReleaseAmount: string;
};

export type UnitEconomicsRowDto = {
  orderId: string;
  orderCode: string;
  label: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  deliveryOpen: boolean;
} & UnitEconomicsMoneyFields;

export type UnitEconomicsListDto = {
  items: UnitEconomicsRowDto[];
  totals: {
    invoicedAmount: string;
    receivedAmount: string;
    receivableAmount: string;
    expensesPaidAmount: string;
    plannedBonuses: string;
    cashBalance: string;
    outCommittedAmount: string;
  };
};

export type UnitEconomicsInvoiceLineDto = {
  id: string;
  code: string;
  amount: string;
  moneyStatus: string;
  type: string;
  dueDate: string | null;
  paidDate: string | null;
  receivedOnInvoice: string;
};

export type UnitEconomicsPaymentLineDto = {
  id: string;
  invoiceId: string;
  invoiceCode: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
};

export type UnitEconomicsExpenseLineDto = {
  journalEntryId: string;
  expenseId: string;
  name: string;
  amount: string;
  bookedAt: string;
  sourceType: string;
};

export type UnitEconomicsBonusLineDto = {
  bonusEntryId: string;
  employeeName: string;
  type: string;
  status: string;
  title: string | null;
  fullAmount: string;
  payableAmount: string;
  releasedAmount: string;
  paidAmount: string;
  earnedPeriod: string | null;
};

export type UnitEconomicsOrderDetailDto = {
  orderId: string;
  orderCode: string;
  label: string;
  projectCode: string;
  projectId: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  summary: UnitEconomicsMoneyFields;
  invoices: UnitEconomicsInvoiceLineDto[];
  payments: UnitEconomicsPaymentLineDto[];
  expenses: UnitEconomicsExpenseLineDto[];
  bonuses: UnitEconomicsBonusLineDto[];
};
