export interface MrrSubscriptionRevenueQuery {
  dateFrom?: string;
  dateTo?: string;
}

export interface MrrSubscriptionRevenueTypeRow {
  type: string;
  activeSubscriptionCount: number;
  activeMrr: string;
}

export interface MrrSubscriptionRevenueReport {
  reportId: 'mrr-subscription-revenue';
  title: 'MRR / Subscription Revenue';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    snapshotDate: string;
    basis: 'cash';
  };
  active: {
    activeMrr: string;
    activeSubscriptionCount: number;
    byType: MrrSubscriptionRevenueTypeRow[];
  };
  movement: {
    newMrr: string;
    newSubscriptionCount: number;
    churnedMrr: string;
    churnedSubscriptionCount: number;
  };
  paidRevenue: {
    paidSubscriptionRevenue: string;
    paymentCount: number;
    invoicedSubscriptionAmount: string;
    invoiceCount: number;
  };
  notes: string[];
}
