import { BadRequestException, ForbiddenException } from '@nestjs/common';

export interface DealWonOverrideContext {
  reason?: string | null;
  actorId?: string;
  actorRoleLevel?: number;
}

interface DealForWonValidation {
  type: string | null;
  source?: string | null;
  sourcePartnerId?: string | null;
  partnerReferralTerms?: { partnerPercent: unknown } | null;
  orders?: Array<{
    invoices?: Array<{
      moneyStatus: string;
    }>;
  }>;
}

interface ValidationError {
  field: string;
  message: string;
}

const DEPOSIT_REQUIRED_TYPES = new Set(['PRODUCT', 'EXTENSION', 'OUTSOURCE']);
const PRIVILEGED_ROLE_LEVEL = 2;

export function validateDealWonGate(
  deal: DealForWonValidation,
  override: DealWonOverrideContext = {},
): void {
  if (deal.source === 'PARTNER' && deal.sourcePartnerId && !deal.partnerReferralTerms) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'STAGE_GATE_VALIDATION',
      message: 'Deal cannot move to WON: partner referral terms are required',
      errors: [
        {
          field: 'partnerReferralTerms',
          message: 'Partner referral terms must be recorded before Deal Won.',
        },
      ],
    });
  }

  if (!deal.type || !DEPOSIT_REQUIRED_TYPES.has(deal.type)) return;

  const errors = getDealWonErrors(deal);
  if (errors.length === 0) return;
  if (hasValidOverride(override)) return;
  if (override.reason?.trim()) {
    throw new ForbiddenException('Only Owner or CEO can override Deal Won finance blockers.');
  }

  throw new BadRequestException({
    statusCode: 400,
    code: 'STAGE_GATE_VALIDATION',
    message: 'Deal cannot move to WON: finance confirmation is required',
    errors,
  });
}

export function getDealWonErrors(deal: DealForWonValidation): ValidationError[] {
  const errors: ValidationError[] = [];

  const invoices = deal.orders?.flatMap((order) => order.invoices ?? []) ?? [];
  if (invoices.length === 0) {
    errors.push({
      field: 'invoice',
      message: 'At least one linked invoice is required before Deal Won.',
    });
    return errors;
  }

  const firstInvoice = invoices[0];
  if (firstInvoice?.moneyStatus !== 'PAID') {
    errors.push({
      field: 'payment',
      message: 'First linked invoice must be marked as Paid by Finance before Deal Won.',
    });
  }

  return errors;
}

function hasValidOverride(override: DealWonOverrideContext): boolean {
  return Boolean(
    override.reason?.trim() &&
    override.actorId &&
    override.actorRoleLevel !== undefined &&
    override.actorRoleLevel <= PRIVILEGED_ROLE_LEVEL,
  );
}
