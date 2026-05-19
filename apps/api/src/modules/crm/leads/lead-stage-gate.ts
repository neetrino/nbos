import { BadRequestException } from '@nestjs/common';
import { LEAD_STAGE_GATE_ORDER } from '@nbos/shared';
import { validateAttributionGate } from '../attribution-gate';

interface LeadForValidation {
  contactName: string;
  phone: string | null;
  email: string | null;
  assignedTo: string | null;
  notes: string | null;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

function hasContactChannel(lead: LeadForValidation): boolean {
  return Boolean(lead.phone?.trim() || lead.email?.trim());
}

function hasNonBlankNotes(lead: LeadForValidation): boolean {
  return Boolean(lead.notes?.trim());
}

/**
 * Validates required Lead fields when moving to a target status.
 */
export function validateLeadStageGate(lead: LeadForValidation, targetStatus: string) {
  if (targetStatus === 'SPAM') {
    if (!hasNonBlankNotes(lead)) {
      throw stageGateError(targetStatus, [
        { field: 'notes', message: 'Spam reason is required when marking a lead as Spam' },
      ]);
    }
    return;
  }

  const targetIdx = LEAD_STAGE_GATE_ORDER.indexOf(
    targetStatus as (typeof LEAD_STAGE_GATE_ORDER)[number],
  );
  if (targetIdx < 0) return;

  const errors: ValidationError[] = [];
  const reachesStage = (stage: string) =>
    targetIdx >= LEAD_STAGE_GATE_ORDER.indexOf(stage as (typeof LEAD_STAGE_GATE_ORDER)[number]);

  if (reachesStage('NEW') || reachesStage('ON_HOLD')) {
    if (!lead.contactName?.trim()) {
      errors.push({ field: 'contactName', message: 'Contact name is required' });
    }
    if (!hasContactChannel(lead)) {
      errors.push({
        field: 'contact',
        message: 'Phone or email is required',
      });
    }
  }

  if (reachesStage('DIDNT_GET_THROUGH')) {
    if (!lead.assignedTo) {
      errors.push({ field: 'assignedTo', message: "Seller is required from Didn't Get Through" });
    }
    if (!hasNonBlankNotes(lead)) {
      errors.push({
        field: 'notes',
        message: "Contact attempt note is required from Didn't Get Through",
      });
    }
  }

  if (reachesStage('CONTACT_ESTABLISHED') && !hasNonBlankNotes(lead)) {
    errors.push({
      field: 'notes',
      message: 'Conversation or result note is required from Contact Established',
    });
  }

  if (errors.length > 0) {
    throw stageGateError(targetStatus, errors);
  }

  if (reachesStage('DIDNT_GET_THROUGH')) {
    validateAttributionGate(lead, 'Lead', targetStatus);
  }
}

function stageGateError(targetStatus: string, errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    code: 'STAGE_GATE_VALIDATION',
    message: `Cannot move to ${targetStatus}: missing required fields`,
    errors,
  });
}
