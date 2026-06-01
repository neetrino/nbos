/** Swap one id left/right in an order array (no-op at bounds). */
export function moveLayoutId(
  order: string[],
  id: string,
  direction: -1 | 1,
  allIds: string[],
): string[] {
  const base = order.length > 0 ? [...order] : [...allIds];
  const idx = base.indexOf(id);
  if (idx < 0) return base;
  const target = idx + direction;
  if (target < 0 || target >= base.length) return base;
  const next = [...base];
  const current = next[idx];
  const swapWith = next[target];
  if (current === undefined || swapWith === undefined) {
    return base;
  }
  next[idx] = swapWith;
  next[target] = current;
  return next;
}

export function togglePinnedId(pinned: string[], id: string): string[] {
  return pinned.includes(id) ? pinned.filter((p) => p !== id) : [...pinned, id];
}
