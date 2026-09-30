const FORWARD_KIND = 'FORWARD';

export type ForwardMessageAction = {
  kind: typeof FORWARD_KIND;
  sourceMessageIds: string[];
  fromName: string;
  fromContent: string;
};

export function forwardActionMetadata(
  sourceMessageIds: string[],
  fromName: string,
  fromContent: string,
): { messageAction: ForwardMessageAction } {
  const ids = sourceMessageIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
  return {
    messageAction: {
      kind: FORWARD_KIND,
      sourceMessageIds: ids,
      fromName: fromName.trim() || 'Message',
      fromContent: fromContent.trim() || 'Message',
    },
  };
}

export function readForwardedFrom(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const action = (metadata as { messageAction?: unknown }).messageAction;
  if (!action || typeof action !== 'object') return null;
  const row = action as { kind?: unknown; fromName?: unknown };
  if (row.kind !== FORWARD_KIND) return null;
  const name = typeof row.fromName === 'string' ? row.fromName.trim() : '';
  return name || null;
}

export function readForwardedContent(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const action = (metadata as { messageAction?: unknown }).messageAction;
  if (!action || typeof action !== 'object') return null;
  const row = action as { kind?: unknown; fromContent?: unknown };
  if (row.kind !== FORWARD_KIND) return null;
  return typeof row.fromContent === 'string' ? row.fromContent : null;
}

export function readForwardSourceMessageId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const action = (metadata as { messageAction?: unknown }).messageAction;
  if (!action || typeof action !== 'object') return null;
  const row = action as { kind?: unknown; sourceMessageIds?: unknown };
  if (row.kind !== FORWARD_KIND || !Array.isArray(row.sourceMessageIds)) return null;
  const first = row.sourceMessageIds[0];
  return typeof first === 'string' && first.trim() ? first : null;
}
