import type { LeadMergeFieldKey } from '@nbos/shared';
import type { CrmTranslate } from './crm-copy';

export function translateLeadMergeFieldLabels(
  t: CrmTranslate,
): Record<LeadMergeFieldKey, string> {
  return {
    name: t('merge.fields.name'),
    contactName: t('merge.fields.contactName'),
    phone: t('merge.fields.phone'),
    email: t('merge.fields.email'),
    assignedTo: t('merge.fields.assignedTo'),
    source: t('merge.fields.source'),
    sourceDetail: t('merge.fields.sourceDetail'),
    sourcePartnerId: t('merge.fields.sourcePartnerId'),
    sourceContactId: t('merge.fields.sourceContactId'),
    marketingAccountId: t('merge.fields.marketingAccountId'),
    marketingActivityId: t('merge.fields.marketingActivityId'),
  };
}
