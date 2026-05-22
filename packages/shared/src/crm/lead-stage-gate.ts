import { LEAD_STAGE_GATE_ORDER } from '../constants/crm-attribution';
import { getAttributionValidationErrors, type AttributionForValidation } from './attribution-gate';
import type { StageGateError } from '../stage-gates/types';

export type { StageGateError };

export interface LeadStageGateInput extends AttributionForValidation {
  name?: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
  assignedTo: string | null;
  notes: string | null;
}

function hasContactChannel(lead: LeadStageGateInput): boolean {
  return Boolean(lead.phone?.trim() || lead.email?.trim());
}

function hasNonBlankNotes(lead: LeadStageGateInput): boolean {
  return Boolean(lead.notes?.trim());
}

export function getLeadStageGateErrors(
  lead: LeadStageGateInput,
  targetStatus: string,
): StageGateError[] {
  if (targetStatus === 'SPAM') {
    if (hasNonBlankNotes(lead)) return [];
    return [{ field: 'notes', message: 'Spam reason is required when marking a lead as Spam' }];
  }

  if (targetStatus === 'ON_HOLD') {
    return [];
  }

  const targetIdx = LEAD_STAGE_GATE_ORDER.indexOf(
    targetStatus as (typeof LEAD_STAGE_GATE_ORDER)[number],
  );
  if (targetIdx < 0) return [];

  const errors: StageGateError[] = [];
  const reachesStage = (stage: string) =>
    targetIdx >= LEAD_STAGE_GATE_ORDER.indexOf(stage as (typeof LEAD_STAGE_GATE_ORDER)[number]);

  if (targetStatus === 'NEW') {
    if (!lead.contactName?.trim()) {
      errors.push({ field: 'contactName', message: 'Contact name is required' });
    }
    if (!hasContactChannel(lead)) {
      errors.push({ field: 'contact', message: 'Phone or email is required' });
    }
  }

  if (targetStatus !== 'ON_HOLD' && reachesStage('DIDNT_GET_THROUGH')) {
    if (!lead.assignedTo) {
      errors.push({ field: 'assignedTo', message: "Seller is required from Didn't Get Through" });
    }
    errors.push(...getAttributionValidationErrors(lead));
  }

  if (targetStatus === 'SQL') {
    errors.push(...getLeadSqlConversionErrors(lead));
  }

  return errors;
}

function getLeadSqlConversionErrors(lead: LeadStageGateInput): StageGateError[] {
  const errors: StageGateError[] = [];
  if (!lead.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'Inquiry title (product/service) is required before Lead Won / Deal',
    });
  }
  if (!lead.contactName?.trim()) {
    errors.push({ field: 'contactName', message: 'Contact name is required' });
  }
  if (!hasContactChannel(lead)) {
    errors.push({ field: 'contactMethod', message: 'Phone or email is required' });
  }
  if (!lead.assignedTo) {
    errors.push({ field: 'assignedTo', message: 'Assigned Seller is required to create a Deal' });
  }
  errors.push(...getAttributionValidationErrors(lead));
  return errors;
}
