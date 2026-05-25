import { requiresMarketingWhichOneSelection } from '../constants/crm-attribution';

export interface AttributionForValidation {
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
}

export interface StageGateError {
  field: string;
  message: string;
}

export function getAttributionValidationErrors(data: AttributionForValidation): StageGateError[] {
  const errors: StageGateError[] = [];
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
  if (
    requiresMarketingWhichOneSelection(data.source, data.sourceDetail) &&
    !data.marketingAccountId &&
    !data.marketingActivityId
  ) {
    errors.push({
      field: 'whichOne',
      message: 'Which one is required for this marketing channel',
    });
  }
  return errors;
}
