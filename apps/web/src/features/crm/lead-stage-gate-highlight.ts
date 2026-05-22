import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

const CONTACT_CHANNEL_GATE_FIELDS = new Set(['contact', 'contactMethod']);

function isLeadFieldGateRequired(requiredFields: ReadonlySet<string>, field: string): boolean {
  if (requiredFields.has(field)) return true;
  if (field === 'phone' || field === 'email') {
    return [...CONTACT_CHANNEL_GATE_FIELDS].some((gateField) => requiredFields.has(gateField));
  }
  return false;
}

/** Red ring for Lead sheet fields blocked by stage gate validation. */
export function leadStageGateFieldClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return cn(
    className,
    isLeadFieldGateRequired(requiredFields, field) && DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS,
  );
}
