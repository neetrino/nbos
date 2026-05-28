export type UnitEconomicsRowDto = {
  orderId: string;
  orderCode: string;
  label: string;
  projectId: string;
  projectCode: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  deliveryOpen: boolean;
  invoicedAmount: string;
  receivedAmount: string;
  receivableAmount: string;
  expensesPaidAmount: string;
  plannedBonuses: string;
  releasedBonuses: string;
  paidBonuses: string;
  remainingBonuses: string;
  availableCash: string;
  overFundingAmount: string;
  estimatedMargin: string;
};

export type UnitEconomicsListDto = {
  items: UnitEconomicsRowDto[];
  totals: {
    invoicedAmount: string;
    receivedAmount: string;
    receivableAmount: string;
    expensesPaidAmount: string;
    plannedBonuses: string;
    availableCash: string;
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

export type UnitEconomicsOrderDetailDto = {
  orderId: string;
  orderCode: string;
  label: string;
  projectCode: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  summary: {
    invoicedAmount: string;
    receivedAmount: string;
    receivableAmount: string;
  };
  invoices: UnitEconomicsInvoiceLineDto[];
  payments: UnitEconomicsPaymentLineDto[];
};
