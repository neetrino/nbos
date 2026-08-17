import { DEAL_STAGES } from '@/features/crm/constants/dealPipeline';
import { LEAD_STAGES } from '@/features/crm/constants/leadPipeline';

export const ATTRIBUTION_STATUS_FILTER_ALL = 'all';

export type AttributionStatusOption = {
  value: string;
  label: string;
};

const STATUS_LABELS = new Map<string, string>([
  ...LEAD_STAGES.map((stage) => [stage.key, stage.label] as const),
  ...DEAL_STAGES.map((stage) => [stage.key, stage.label] as const),
]);

export function resolveAttributionStatusLabel(status: string): string {
  return STATUS_LABELS.get(status) ?? status.replace(/_/g, ' ');
}

/** Status options from rows currently on the attribution review. */
export function buildAttributionStatusOptions(statuses: string[]): AttributionStatusOption[] {
  return [...new Set(statuses)]
    .map((status) => ({
      value: status,
      label: resolveAttributionStatusLabel(status),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
