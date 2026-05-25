import {
  buildStageGateRequiredFields,
  stageGateFieldClass,
  type SheetStageGateHighlight,
} from '@/lib/stage-gate-highlight';
import { cn } from '@/lib/utils';

export type InvoiceSheetStageGateHighlight = SheetStageGateHighlight;

export function buildInvoiceGateRequiredFields(
  highlight: InvoiceSheetStageGateHighlight | null,
): ReadonlySet<string> {
  if (!highlight) return new Set();
  return buildStageGateRequiredFields(highlight.errors);
}

export function invoiceStageGateFieldClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return stageGateFieldClass(requiredFields, field, className);
}

export function invoiceStageGateSectionClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return cn(
    className,
    requiredFields.has(field) && 'ring-destructive/60 rounded-xl ring-2 ring-offset-2',
  );
}
