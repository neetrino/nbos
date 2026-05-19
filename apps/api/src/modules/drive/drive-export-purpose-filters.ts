import type { FilePurposeEnum } from '@nbos/database';

/** File purposes included in typed ZIP exports (doc 06 §5). */
export const DRIVE_EXPORT_OFFER_PURPOSES = [
  'OFFER',
  'CONTRACT',
] as const satisfies readonly FilePurposeEnum[];

export const DRIVE_EXPORT_MEETING_PURPOSES = [
  'MEETING_RECORDING',
] as const satisfies readonly FilePurposeEnum[];

export const DRIVE_EXPORT_CALL_PURPOSES = [
  'CALL_RECORDING',
] as const satisfies readonly FilePurposeEnum[];

export const DRIVE_EXPORT_PARTNER_PURPOSES = [
  'PARTNER_AGREEMENT',
] as const satisfies readonly FilePurposeEnum[];
