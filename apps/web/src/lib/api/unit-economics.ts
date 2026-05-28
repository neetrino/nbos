import { api } from '../api';

export type UnitEconomicsRow = {
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

export type UnitEconomicsList = {
  items: UnitEconomicsRow[];
  totals: {
    invoicedAmount: string;
    receivedAmount: string;
    receivableAmount: string;
    expensesPaidAmount: string;
    plannedBonuses: string;
    availableCash: string;
  };
};

export type UnitEconomicsInvoiceLine = {
  id: string;
  code: string;
  amount: string;
  moneyStatus: string;
  type: string;
  dueDate: string | null;
  paidDate: string | null;
  receivedOnInvoice: string;
};

export type UnitEconomicsPaymentLine = {
  id: string;
  invoiceId: string;
  invoiceCode: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
};

export type UnitEconomicsOrderDetail = {
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
  invoices: UnitEconomicsInvoiceLine[];
  payments: UnitEconomicsPaymentLine[];
};

export type UnitEconomicsDrilldownFocus = 'invoices' | 'payments';

export const unitEconomicsApi = {
  list: () => api.get<UnitEconomicsList>('/api/unit-economics'),
  orderDetail: (orderId: string) =>
    api.get<UnitEconomicsOrderDetail>(`/api/unit-economics/orders/${orderId}`),
};
