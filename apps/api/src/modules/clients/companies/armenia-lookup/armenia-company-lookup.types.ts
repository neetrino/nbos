export type ArmeniaCompanyLookupKind = 'tin' | 'name';

export interface ArmeniaCompanyLookupQuery {
  kind: ArmeniaCompanyLookupKind;
  value: string;
}

export interface ArmeniaCompanyLookupItem {
  tin: string;
  name: string;
  legalForm: string | null;
  registeredAddress: string | null;
  registrationDate: string | null;
  status: string | null;
  isActive: boolean;
  activityCode: string | null;
  country: string;
}

export interface ArmeniaCompanyLookupResponse {
  queryKind: ArmeniaCompanyLookupKind;
  items: ArmeniaCompanyLookupItem[];
}

export interface SrcTaxpayerSearchRow {
  tin: unknown;
  name: unknown;
  address: unknown;
  legalStatus: unknown;
  submitDate: unknown;
  status: unknown;
  entType: unknown;
}

export interface SrcTaxpayerSearchPayload {
  data: unknown;
}
