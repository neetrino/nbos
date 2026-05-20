export interface CreateDomainBody {
  domainName: string;
  provider?: string;
  purchaseDate?: string;
  expiryDate?: string;
  renewalCost?: number;
  clientCharge?: number;
  autoRenew?: boolean;
  status?: string;
}

export type UpdateDomainBody = Partial<CreateDomainBody>;
