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
  productId: string | null;
  extensionId: string | null;
  productLabel: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  deliveryOpen: boolean;
} & UnitEconomicsMoneyFields;

export type UnitEconomicsProjectRollup = {
  projectId: string;
  projectCode: string;
  projectName: string;
  unitCount: number;
  receivedAmount: string;
  receivableAmount: string;
  expensesPaidAmount: string;
  remainingBonuses: string;
  cashBalance: string;
  outCommittedAmount: string;
  marginAfterCommitments: string;
};

export type UnitEconomicsProductRollup = {
  rollupKey: string;
  kind: 'PRODUCT' | 'EXTENSION' | 'ORDER';
  label: string;
  projectId: string;
  projectCode: string;
  unitCount: number;
  receivedAmount: string;
  receivableAmount: string;
  expensesPaidAmount: string;
  remainingBonuses: string;
  cashBalance: string;
  outCommittedAmount: string;
  marginAfterCommitments: string;
};

export type UnitEconomicsBonusPool = {
  poolKey: string;
  poolKind: 'ORDER';
  anchorOrderId: string;
  poolName: string;
  orderCode: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  entryCount: number;
  employeeCount: number;
  sumTotalAmount: string;
  sumPipelineAmount: string;
  sumPaidAmount: string;
  sumClawbackAmount: string;
  ledgerPlannedAmount: string | null;
  ledgerReleasedAmount: string | null;
  ledgerRemainingAmount: string | null;
  ledgerAvailableFunding: string | null;
  ledgerOverFundingAmount: string | null;
  ledgerReceivedAmount: string | null;
  ledgerPoolStatus: string | null;
  orderIds: string[];
  orderCodes: string[];
  fundingHealth: string;
  fundingFillPercent: number | null;
};

export type UnitEconomicsBonusBreakdown = {
  poolKey: string;
  pool: UnitEconomicsBonusPool | null;
  employeeLines: unknown[];
};

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
  projects: UnitEconomicsProjectRollup[];
  products: UnitEconomicsProductRollup[];
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
  bonusBreakdown: UnitEconomicsBonusBreakdown;
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
