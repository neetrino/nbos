import {
  domainHeaderNeedsAction,
  summarizeDomainHeaderStatus,
  type DomainHeaderStatusInput,
  type DomainHeaderStatusKind,
} from '@nbos/shared';
import type { ClientServiceRecord } from '@/lib/api/client-services';

export function clientServiceToDomainHeaderInput(
  row: ClientServiceRecord,
): DomainHeaderStatusInput {
  const stage = row.paymentStage;
  return {
    domainName: row.name,
    connectionMode:
      row.connectionMode === 'PURCHASE' ||
      row.connectionMode === 'EXISTING_ACCESS' ||
      row.connectionMode === 'CLIENT_DNS'
        ? row.connectionMode
        : null,
    status: row.status,
    hasOpenInvoice: stage === 'invoice' || stage === 'pay_now',
    hasCredential: Boolean(row.providerAccountId),
    registrationConfirmed: Boolean(row.registrationConfirmedAt),
    connectionVerified: Boolean(row.connectionVerifiedAt),
    hasDnsInstructions: Boolean(row.dnsInstructions?.trim()),
  };
}

export function productDomainHeaderKind(
  rows: readonly ClientServiceRecord[],
): DomainHeaderStatusKind {
  return summarizeDomainHeaderStatus(rows.map(clientServiceToDomainHeaderInput));
}

export function productDomainHeaderNeedsAction(rows: readonly ClientServiceRecord[]): boolean {
  return domainHeaderNeedsAction(rows.map(clientServiceToDomainHeaderInput));
}

export function primaryDomainName(rows: readonly ClientServiceRecord[]): string {
  const active = rows.filter((row) => row.status !== 'CANCELLED');
  return active[0]?.name ?? '';
}
