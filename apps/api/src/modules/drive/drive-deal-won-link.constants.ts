import type { FilePurposeEnum } from '@nbos/database';

/** File purposes auto-linked to Project / Product / Client on Deal Won (NBOS Drive canon). */
export const DEAL_WON_AUTO_LINK_PURPOSES: readonly FilePurposeEnum[] = [
  'OFFER',
  'CONTRACT',
  'HANDOFF_DOCUMENT',
];
