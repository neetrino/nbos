import { DELIVERY_FUNCTION_ICON_ALLOWLIST } from './constants';

export const OPERATIONAL_DTO_FINANCIAL_KEYS = [
  'units',
  'rate',
  'roleUnits',
  'roleRates',
  'baseBonus',
  'extraBonus',
  'deliveryNormativeSnapshot',
  'calculationSnapshot',
  'amount',
  'originalAmount',
  'payableAmount',
  'sharePercent',
] as const;

const FINANCIAL_KEYS = new Set<string>(OPERATIONAL_DTO_FINANCIAL_KEYS);

export type DeliveryFunctionOperationalDto = {
  id: string;
  code: string;
  category: string;
  iconKey: string;
  status: string;
  title: string;
  summary: string;
  scopeBoundaries: string;
  instructions: string;
  acceptanceCriteria: string;
  contentVersion: number | null;
  attachments: DeliveryFunctionAttachmentOperationalDto[];
};

export type DeliveryFunctionAttachmentOperationalDto = {
  id: string;
  fileAssetId: string;
  caption: string | null;
  sortOrder: number;
};

export function isAllowedDeliveryFunctionIcon(iconKey: string): boolean {
  return (DELIVERY_FUNCTION_ICON_ALLOWLIST as readonly string[]).includes(iconKey);
}

export function omitFinancialFields<T extends Record<string, unknown>>(
  input: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (FINANCIAL_KEYS.has(key)) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function assertNoFinancialLeak(payload: unknown, path = 'root'): string[] {
  if (payload === null || payload === undefined) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload.flatMap((item, index) => assertNoFinancialLeak(item, `${path}[${index}]`));
  }
  if (typeof payload !== 'object') {
    return [];
  }
  const record = payload as Record<string, unknown>;
  const leaks: string[] = [];
  for (const key of Object.keys(record)) {
    if (FINANCIAL_KEYS.has(key)) {
      leaks.push(`${path}.${key}`);
    } else {
      leaks.push(...assertNoFinancialLeak(record[key], `${path}.${key}`));
    }
  }
  return leaks;
}
