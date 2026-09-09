const EXPIRY_LABEL_RE =
  /(?:expir(?:y|es|ation)(?:\s+date)?|expire[sd]?|paid-till|registry\s+expiry\s+date|registrar\s+registration\s+expiration\s+date|valid-date|renewal\s+date|valid until|expires on)\s*[:\s]+([0-9]{4}[-./][0-9]{2}[-./][0-9]{2}(?:[t\s][0-9:.z+-]+)?|[0-9]{2}[-./][0-9]{2}[-./][0-9]{4})/i;

const NO_MATCH_MARKERS = [
  'no match',
  'not found',
  'no entries found',
  'no data found',
  'nothing found',
  'object does not exist',
  'no information available',
  'status: free',
  'status: available',
];

export function parseWhoisExpiryDate(text: string): Date | null {
  const match = EXPIRY_LABEL_RE.exec(text);
  if (!match?.[1]) return null;
  return parseRegistryDate(match[1]);
}

export function isWhoisNotFound(text: string): boolean {
  const lower = text.toLowerCase();
  return NO_MATCH_MARKERS.some((marker) => lower.includes(marker));
}

export function parseRegistryDate(raw: string): Date | null {
  const trimmed = raw.trim().replace(/\.$/, '');
  const isoLike = trimmed.includes('T') ? trimmed : trimmed.replace(/\s+/, 'T');
  const normalized = isoLike.replace(/(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function utcCalendarDayMs(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

export function isRegistryExpiryLater(registryExpiry: Date, storedRenewal: Date): boolean {
  return utcCalendarDayMs(registryExpiry) > utcCalendarDayMs(storedRenewal);
}

export interface RdapEventLike {
  eventAction?: string;
  eventDate?: string;
}

export function parseRdapExpiry(events: readonly RdapEventLike[] | undefined): Date | null {
  if (!events) return null;
  for (const event of events) {
    const action = event.eventAction?.toLowerCase() ?? '';
    if (action !== 'expiration' && action !== 'expiry' && action !== 'expire') continue;
    if (!event.eventDate) continue;
    const parsed = parseRegistryDate(event.eventDate);
    if (parsed) return parsed;
  }
  return null;
}
