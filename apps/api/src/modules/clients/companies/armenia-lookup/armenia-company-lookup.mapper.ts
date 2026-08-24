import { ARMENIA_COUNTRY_NAME, SRC_ACTIVE_STATUS } from './armenia-company-lookup.constants';
import type {
  ArmeniaCompanyLookupItem,
  SrcTaxpayerSearchRow,
} from './armenia-company-lookup.types';

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asIsoDate(value: unknown): string | null {
  const raw = asTrimmedString(value);
  if (!raw) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

export function mapSrcTaxpayerRow(row: SrcTaxpayerSearchRow): ArmeniaCompanyLookupItem | null {
  const tin = asTrimmedString(row.tin);
  const name = asTrimmedString(row.name);
  if (!tin || !name) return null;
  const status = asTrimmedString(row.status);
  return {
    tin,
    name,
    legalForm: asTrimmedString(row.legalStatus),
    registeredAddress: asTrimmedString(row.address),
    registrationDate: asIsoDate(row.submitDate),
    status,
    isActive: status === SRC_ACTIVE_STATUS,
    activityCode: asTrimmedString(row.entType),
    country: ARMENIA_COUNTRY_NAME,
  };
}

export function filterExactTinMatches(
  items: ArmeniaCompanyLookupItem[],
  tin: string,
): ArmeniaCompanyLookupItem[] {
  return items.filter((item) => item.tin === tin);
}

export function isSrcTaxpayerSearchRow(value: unknown): value is SrcTaxpayerSearchRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseSrcTaxpayerRows(payload: unknown): SrcTaxpayerSearchRow[] | null {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null;
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  return data.filter(isSrcTaxpayerSearchRow);
}
