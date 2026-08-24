export interface CompanyLookupFillTarget {
  name: string;
  legalName: string;
  taxId: string;
  legalAddress: string;
  country: string;
}

export interface CompanyLookupFillSource {
  tin: string;
  name: string;
  registeredAddress: string | null;
  country: string;
}

export const COMPANY_LOOKUP_FILL_FIELDS = [
  'name',
  'legalName',
  'taxId',
  'legalAddress',
  'country',
] as const;

export type CompanyLookupFillField = (typeof COMPANY_LOOKUP_FILL_FIELDS)[number];

function isEmpty(value: string): boolean {
  return value.trim().length === 0;
}

export function applyCompanyLookupFill(
  current: CompanyLookupFillTarget,
  source: CompanyLookupFillSource,
): { next: CompanyLookupFillTarget; filled: CompanyLookupFillField[] } {
  const next = { ...current };
  const filled: CompanyLookupFillField[] = [];

  if (isEmpty(current.taxId) && source.tin) {
    next.taxId = source.tin;
    filled.push('taxId');
  }
  if (isEmpty(current.legalName) && source.name) {
    next.legalName = source.name;
    filled.push('legalName');
  }
  if (isEmpty(current.name) && source.name) {
    next.name = source.name;
    filled.push('name');
  }
  if (isEmpty(current.legalAddress) && source.registeredAddress) {
    next.legalAddress = source.registeredAddress;
    filled.push('legalAddress');
  }
  if (isEmpty(current.country) && source.country) {
    next.country = source.country;
    filled.push('country');
  }

  return { next, filled };
}
