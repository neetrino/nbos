import { api } from '../api';

/** Money fields shared by list rows and order detail summary. */
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

export type UnitEconomicsRow = {
  orderId: string;
  orderCode: string;
  label: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  deliveryOpen: boolean;
} & UnitEconomicsMoneyFields;

export type UnitEconomicsList = {
  items: UnitEconomicsRow[];
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

export type UnitEconomicsExpenseLine = {
  journalEntryId: string;
  expenseId: string;
  name: string;
  amount: string;
  bookedAt: string;
  sourceType: string;
};

export type UnitEconomicsBonusLine = {
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

export type UnitEconomicsOrderDetail = {
  orderId: string;
  orderCode: string;
  label: string;
  projectCode: string;
  projectId: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  summary: UnitEconomicsMoneyFields;
  invoices: UnitEconomicsInvoiceLine[];
  payments: UnitEconomicsPaymentLine[];
  expenses: UnitEconomicsExpenseLine[];
  bonuses: UnitEconomicsBonusLine[];
};

export type UnitEconomicsDrilldownFocus = 'invoices' | 'payments' | 'expenses' | 'bonuses';

export const unitEconomicsApi = {
  list: async (): Promise<UnitEconomicsList> => {
    const resp = await api.get<UnitEconomicsList>('/api/unit-economics');
    return resp.data;
  },
  orderDetail: async (orderId: string): Promise<UnitEconomicsOrderDetail> => {
    const resp = await api.get<UnitEconomicsOrderDetail>(`/api/unit-economics/orders/${orderId}`);
    return resp.data;
  },
};
