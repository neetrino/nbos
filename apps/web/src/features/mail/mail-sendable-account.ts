const MAIL_SENDABLE_STATUSES = new Set(['ACTIVE', 'DEGRADED', 'SYNCING']);

export function isMailAccountSendable(status: string): boolean {
  return MAIL_SENDABLE_STATUSES.has(status);
}

export function preferredSendableAccountId(
  accounts: ReadonlyArray<{ id: string; status: string }>,
  defaultAccountId?: string | null,
): string {
  const sendable = accounts.filter((account) => isMailAccountSendable(account.status));
  if (defaultAccountId && sendable.some((account) => account.id === defaultAccountId)) {
    return defaultAccountId;
  }
  return sendable[0]?.id ?? '';
}
