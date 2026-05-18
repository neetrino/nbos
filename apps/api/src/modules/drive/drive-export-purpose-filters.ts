/** File purposes included in typed ZIP exports (doc 06 §5). */
export const DRIVE_EXPORT_OFFER_PURPOSES = [
  'OFFER_DRAFT',
  'OFFER_SENT',
  'OFFER_APPROVED',
  'MESSENGER_PROOF',
  'CONTRACT',
] as const;

export const DRIVE_EXPORT_MEETING_PURPOSES = ['MEETING_RECORDING'] as const;

export const DRIVE_EXPORT_CALL_PURPOSES = ['CALL_RECORDING'] as const;

export const DRIVE_EXPORT_PARTNER_PURPOSES = ['PARTNER_AGREEMENT'] as const;
