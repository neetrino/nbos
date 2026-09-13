import type { CrmTranslate } from '@/features/crm/i18n/crm-copy';
import { resolveAttributionStatusLabel } from '@/features/marketing/i18n/marketing-copy';

export const ATTRIBUTION_STATUS_FILTER_ALL = 'all';

export type AttributionStatusOption = {
  value: string;
  label: string;
};

export { resolveAttributionStatusLabel };

/** Status options from rows currently on the attribution review. */
export function buildAttributionStatusOptions(
  statuses: string[],
  tCrm: CrmTranslate,
): AttributionStatusOption[] {
  return [...new Set(statuses)]
    .map((status) => ({
      value: status,
      label: resolveAttributionStatusLabel(tCrm, status),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
