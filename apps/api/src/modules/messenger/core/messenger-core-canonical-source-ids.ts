const PURPOSE_FORWARD = 'FORWARD';

export function canonicalSourceMessageIds(message: {
  id: string;
  references?: Array<{ purpose: string; sourceMessageId: string; sortOrder: number }>;
}): string[] {
  const forwards = [...(message.references ?? [])]
    .filter((row) => row.purpose === PURPOSE_FORWARD)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
      return left.sourceMessageId.localeCompare(right.sourceMessageId);
    });
  if (forwards.length === 0) return [message.id];
  return forwards.map((row) => row.sourceMessageId);
}
