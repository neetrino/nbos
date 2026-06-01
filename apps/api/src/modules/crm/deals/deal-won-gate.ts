import { BadRequestException } from '@nestjs/common';

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

export interface DealWonGateOptions {
  /** Skip first-invoice-paid requirement (exception order flow only). */
  skipFinance?: boolean;
}

export function validateDealWonGate(
  deal: DealForWonValidation,
  options: DealWonGateOptions = {},
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
  if (options.skipFinance) return;

  const errors = getDealWonErrors(deal);
  if (errors.length === 0) return;

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
