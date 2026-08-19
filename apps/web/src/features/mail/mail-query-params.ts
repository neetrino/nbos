export const MAIL_ACCOUNT_QUERY_KEY = 'accountId';
export const MAIL_OPEN_THREAD_QUERY_KEY = 'openThreadId';
export const MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY = 'openShareMailboxId';
export const MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY = 'openConnectMailbox';
export const MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY = 'openReconnectMailboxId';

export function applyMailConnectPanelQuery(params: URLSearchParams, accountId?: string): void {
  params.delete(MAIL_OPEN_THREAD_QUERY_KEY);
  params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
  if (accountId) {
    params.set(MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY, accountId);
    params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
    return;
  }
  params.set(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY, '1');
  params.delete(MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY);
}

export function clearMailConnectPanelQuery(params: URLSearchParams): void {
  params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
  params.delete(MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY);
}
