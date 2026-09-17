export const DOMAIN_CONNECTION_MODES = ['PURCHASE', 'EXISTING_ACCESS', 'CLIENT_DNS'] as const;

export type DomainConnectionMode = (typeof DOMAIN_CONNECTION_MODES)[number];

export function isDomainConnectionMode(value: string): value is DomainConnectionMode {
  return (DOMAIN_CONNECTION_MODES as readonly string[]).includes(value);
}

/** Empty/legacy values stay unknown. Do not infer purchase from a missing password. */
export function resolveDomainConnectionMode(
  value: string | null | undefined,
): DomainConnectionMode | null {
  if (value && isDomainConnectionMode(value)) return value;
  return null;
}

export const DOMAIN_OPERATION_MAX_DOMAINS = 20;
export const DOMAIN_REGISTRANT_DATA_MAX_LENGTH = 16_000;
export const DOMAIN_DNS_INSTRUCTIONS_MAX_LENGTH = 8_000;

export type DomainHeaderStatusKind =
  | 'empty'
  | 'awaiting_payment'
  | 'preparing'
  | 'purchased'
  | 'connected'
  | 'client_dns'
  | 'multiple';

/** Header button color: idle start, in-progress, or completed variant. */
export type DomainHeaderTone = 'idle' | 'progress' | 'done';

export interface DomainHeaderStatusInput {
  domainName: string;
  connectionMode: DomainConnectionMode | null;
  status: string;
  hasOpenInvoice: boolean;
  hasCredential: boolean;
  registrationConfirmed: boolean;
  connectionVerified: boolean;
  hasDnsInstructions: boolean;
  dnsPrepTaskDone?: boolean;
}

export function isDomainConnectionSatisfied(row: DomainHeaderStatusInput): boolean {
  if (row.connectionMode === 'CLIENT_DNS') {
    return Boolean(row.dnsPrepTaskDone);
  }
  if (row.connectionMode === 'EXISTING_ACCESS') {
    return row.hasCredential && row.connectionVerified;
  }
  if (row.connectionMode === 'PURCHASE') {
    return row.hasCredential && row.registrationConfirmed && row.connectionVerified;
  }
  return false;
}

export function summarizeDomainHeaderStatus(
  rows: readonly DomainHeaderStatusInput[],
): DomainHeaderStatusKind {
  const active = rows.filter((row) => row.status !== 'CANCELLED');
  if (active.length === 0) return 'empty';
  if (active.length > 1) return 'multiple';
  return domainHeaderStatusForRow(active[0]!);
}

/** Calm blue at start; orange while a domain is open; green when every variant is done. */
export function summarizeDomainHeaderTone(
  rows: readonly DomainHeaderStatusInput[],
): DomainHeaderTone {
  const active = rows.filter((row) => row.status !== 'CANCELLED');
  if (active.length === 0) return 'idle';
  return active.every(isDomainConnectionSatisfied) ? 'done' : 'progress';
}

/** True when any active domain still needs payment or purchase prep. */
export function domainHeaderNeedsAction(rows: readonly DomainHeaderStatusInput[]): boolean {
  return rows
    .filter((row) => row.status !== 'CANCELLED')
    .some((row) => {
      const kind = domainHeaderStatusForRow(row);
      return kind === 'preparing' || kind === 'awaiting_payment';
    });
}

export function domainHeaderStatusForRow(row: DomainHeaderStatusInput): DomainHeaderStatusKind {
  if (row.connectionMode === 'CLIENT_DNS') return 'client_dns';
  if (row.connectionVerified && row.hasCredential) return 'connected';
  if (row.registrationConfirmed) return 'purchased';
  if (row.hasOpenInvoice) return 'awaiting_payment';
  return 'preparing';
}
