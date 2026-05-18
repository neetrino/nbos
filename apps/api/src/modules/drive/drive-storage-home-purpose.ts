import type { FilePurposeEnum } from '@nbos/database';

const PURPOSE_SUBFOLDER: Partial<Record<FilePurposeEnum, string>> = {
  OFFER_DRAFT: 'offers',
  OFFER_SENT: 'offers',
  OFFER_APPROVED: 'offers',
  MESSENGER_PROOF: 'screenshots',
  CONTRACT: 'contracts',
  HANDOFF_DOCUMENT: 'handoff',
  DESIGN_ASSET: 'design',
  DELIVERY_FILE: 'delivery',
  INVOICE_REQUEST_PROOF: 'finance',
  PAYMENT_PROOF: 'finance',
  EXPENSE_PROOF: 'finance',
  PARTNER_AGREEMENT: 'agreements',
  SUPPORT_EVIDENCE: 'evidence',
  TASK_ATTACHMENT: 'attachments',
  WORKSPACE_ARTIFACT: 'artifacts',
  SOP_DOCUMENT: 'sop',
  TRAINING_MATERIAL: 'training',
  MEETING_RECORDING: 'recordings',
  CALL_RECORDING: 'recordings',
  OTHER: 'files',
};

/** Optional purpose segment under the entity context path (canon §2.2). */
export function purposeSubfolder(purpose: FilePurposeEnum | null | undefined): string {
  if (!purpose) return 'files';
  return PURPOSE_SUBFOLDER[purpose] ?? 'files';
}

export function purposeSlugForFilename(purpose: FilePurposeEnum | null | undefined): string {
  if (!purpose) return 'other';
  return purpose.toLowerCase().replace(/_/g, '-');
}
