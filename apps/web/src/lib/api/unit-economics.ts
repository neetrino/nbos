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

export const unitEconomicsApi = {
  list: () => api.get<UnitEconomicsList>('/api/unit-economics'),
};
