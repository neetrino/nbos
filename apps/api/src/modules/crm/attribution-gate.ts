import { BadRequestException } from '@nestjs/common';

interface AttributionForValidation {
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

const CHANNELS_REQUIRING_MARKETING_LINK = new Set(['LIST_AM', 'GOOGLE_ADS', 'META_ADS']);

export function validateAttributionGate(
  data: AttributionForValidation,
  context: 'Lead' | 'Deal',
  targetStatus: string,
): void {
  const errors = getAttributionErrors(data);
  if (errors.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'ATTRIBUTION_GATE_VALIDATION',
    message: `${context} cannot move to ${targetStatus}: missing attribution fields`,
    errors,
  });
}

function getAttributionErrors(data: AttributionForValidation): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.source) {
    errors.push({ field: 'source', message: 'From is required' });
    return errors;
  }
  if ((data.source === 'MARKETING' || data.source === 'SALES') && !data.sourceDetail) {
    errors.push({ field: 'sourceDetail', message: 'Where is required for this source' });
  }
  if (data.source === 'PARTNER' && !data.sourcePartnerId) {
    errors.push({ field: 'sourcePartnerId', message: 'Partner must be selected' });
  }
  if (data.source === 'CLIENT' && !data.sourceContactId) {
    errors.push({ field: 'sourceContactId', message: 'Client/referral contact must be selected' });
  }
  if (requiresMarketingLink(data) && !data.marketingAccountId && !data.marketingActivityId) {
    errors.push({
      field: 'whichOne',
      message: 'Which one is required for this marketing channel',
    });
  }
  return errors;
}

function requiresMarketingLink(data: AttributionForValidation): boolean {
  return (
    data.source === 'MARKETING' && CHANNELS_REQUIRING_MARKETING_LINK.has(data.sourceDetail ?? '')
  );
}
