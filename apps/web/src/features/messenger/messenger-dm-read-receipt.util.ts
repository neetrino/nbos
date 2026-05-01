/** Label shown when the DM peer has read up to this message (internal MVP). */
export const MESSENGER_DM_READ_RECEIPT_LABEL = 'Read';

/**
 * Id of the latest own message the peer has read (by their `lastReadAt` cursor), or null.
 * Messages are assumed chronological in `messages`.
 */
export function dmReadReceiptMessageId(
  messages: readonly { id: string; senderId: string; timestamp: string }[],
  meId: string,
  peerLastReadAt: string | null,
): string | null {
  if (!peerLastReadAt) return null;
  const peerTs = new Date(peerLastReadAt).getTime();
  if (Number.isNaN(peerTs)) return null;
  let candidate: string | null = null;
  for (const m of messages) {
    if (m.senderId !== meId) continue;
    const t = new Date(m.timestamp).getTime();
    if (Number.isNaN(t)) continue;
    if (t <= peerTs) candidate = m.id;
  }
  return candidate;
}
