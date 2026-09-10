export function resolveActiveConversation<T extends { id: string }>(
  items: readonly T[],
  activeId: string | null,
  opened: T | null,
): T | null {
  if (!activeId) return null;
  return items.find((row) => row.id === activeId) ?? (opened?.id === activeId ? opened : null);
}

export function commitOpenedConversation<T extends { id: string }>(
  activeId: string | null,
  currentOpened: T | null,
  incoming: T | null,
): T | null {
  if (!incoming) return null;
  if (incoming.id !== activeId) return currentOpened;
  return incoming;
}
