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
  productId: string | null;
  extensionId: string | null;
  productLabel: string;
  /** Product entity id for grouping extensions with their parent product. */
  productGroupId: string | null;
  productGroupName: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  deliveryOpen: boolean;
} & UnitEconomicsMoneyFields;

export type UnitEconomicsProjectRollupDto = {
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

export type UnitEconomicsProductRollupDto = {
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

export type UnitEconomicsBonusEmployeeLineDto = {
  employeeId: string;
  employeeName: string;
  role: string | null;
  bonusTypes: string[];
  entryCount: number;
  plannedAmount: string;
  pipelineAmount: string;
  releasedAmount: string;
  includedInPayrollAmount: string;
  paidAmount: string;
  remainingAmount: string;
  burnedAmount: string | null;
  carryOverAmount: string | null;
  suggestedReleaseAmount: string | null;
  kpiGatePassed: boolean | null;
  primaryStatus: string | null;
};

/** Order-scoped bonus ledger for Unit Economics drill-down (not a separate Finance page). */
export type UnitEconomicsBonusPoolDto = {
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

export type UnitEconomicsBonusBreakdownDto = {
  poolKey: string;
  pool: UnitEconomicsBonusPoolDto | null;
  employeeLines: UnitEconomicsBonusEmployeeLineDto[];
};

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
  projects: UnitEconomicsProjectRollupDto[];
  products: UnitEconomicsProductRollupDto[];
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
  bonusBreakdown: UnitEconomicsBonusBreakdownDto;
};
