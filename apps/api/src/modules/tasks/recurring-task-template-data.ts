export interface RecurringChecklistSnapshot {
  title: string;
  items: string[];
}

export interface RecurringLinkSnapshot {
  entityType: string;
  entityId: string;
}

export function parseRecurringChecklistData(raw: unknown): RecurringChecklistSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const title =
    typeof record.title === 'string' && record.title.trim() ? record.title.trim() : 'Checklist';
  const items = normalizeChecklistItems(record.items);
  if (items.length === 0) return null;
  return { title, items };
}

export function parseRecurringLinksData(raw: unknown): RecurringLinkSnapshot[] {
  if (Array.isArray(raw)) return normalizeLinkRows(raw);
  if (!raw || typeof raw !== 'object') return [];
  const record = raw as Record<string, unknown>;
  return Array.isArray(record.links) ? normalizeLinkRows(record.links) : [];
}

export function toRecurringChecklistData(
  items: string[],
  title = 'Checklist',
): RecurringChecklistSnapshot {
  return {
    title,
    items: items.map((item) => item.trim()).filter((item) => item.length > 0),
  };
}

function normalizeChecklistItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const items: string[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string' && entry.trim()) {
      items.push(entry.trim());
      continue;
    }
    if (entry && typeof entry === 'object' && 'text' in entry) {
      const text = (entry as { text?: unknown }).text;
      if (typeof text === 'string' && text.trim()) items.push(text.trim());
    }
  }
  return items;
}

function normalizeLinkRows(raw: unknown[]): RecurringLinkSnapshot[] {
  const links: RecurringLinkSnapshot[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as { entityType?: unknown; entityId?: unknown };
    if (typeof row.entityType !== 'string' || typeof row.entityId !== 'string') continue;
    const entityType = row.entityType.trim();
    const entityId = row.entityId.trim();
    if (!entityType || !entityId) continue;
    links.push({ entityType, entityId });
  }
  return links;
}
