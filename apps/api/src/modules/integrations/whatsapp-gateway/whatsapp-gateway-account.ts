/** Safe account fields from `GET /api/v1/accounts`. Phone numbers are dropped. */
export type WhatsAppGatewayAccountSummary = {
  id: string;
  isActive: boolean;
  status: string;
};

export type LegacyGroupAccountVerdict = 'match' | 'mismatch' | 'unknown';

const CONNECTED = 'CONNECTED';

export function normalizeGatewayAccountList(data: unknown): WhatsAppGatewayAccountSummary[] {
  if (!Array.isArray(data)) return [];
  const accounts: WhatsAppGatewayAccountSummary[] = [];
  for (const item of data) {
    const account = readAccount(item);
    if (account) accounts.push(account);
  }
  return accounts;
}

/**
 * Legacy `GET /api/groups` is served by the project's single active account.
 * More than one active account, or a session that is not CONNECTED, is unknown.
 */
export function classifyLegacyGroupAccount(
  accounts: readonly WhatsAppGatewayAccountSummary[],
  targetAccountId: string,
): LegacyGroupAccountVerdict {
  const active = accounts.filter((account) => account.isActive);
  const only = active.length === 1 ? active[0] : undefined;
  if (!only) return 'unknown';
  if (only.id !== targetAccountId) return 'mismatch';
  if (only.status !== CONNECTED) return 'unknown';
  return 'match';
}

function readAccount(item: unknown): WhatsAppGatewayAccountSummary | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  if (!id) return null;
  const status = typeof record.status === 'string' ? record.status.trim() : '';
  return { id, isActive: record.isActive === true, status };
}
