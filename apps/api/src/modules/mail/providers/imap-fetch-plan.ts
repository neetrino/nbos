import type { ProviderSyncCursor } from './mail-provider-adapter';

/** Max messages fetched on first sync or after UIDVALIDITY reset. */
export const IMAP_INITIAL_SYNC_WINDOW = 30;

export interface ImapFetchPlan {
  range: string;
  /** True → range is UID-based (incremental); false → sequence-based (recovery window). */
  useUid: boolean;
}

/**
 * UIDVALIDITY change invalidates the stored UID cursor; recovery uses the last-N window.
 */
export function resolveImapLastUid(cursor: ProviderSyncCursor, uidValidity: string): number {
  const validityChanged =
    cursor.imapUidValidity !== undefined && cursor.imapUidValidity !== uidValidity;
  return validityChanged ? 0 : Number(cursor.imapLastUid ?? 0);
}

export function buildImapFetchPlan(lastUid: number, exists: number): ImapFetchPlan | null {
  if (exists <= 0) {
    return null;
  }
  if (lastUid > 0) {
    return { range: `${lastUid + 1}:*`, useUid: true };
  }
  const firstSeq = Math.max(1, exists - IMAP_INITIAL_SYNC_WINDOW + 1);
  return { range: `${firstSeq}:*`, useUid: false };
}
