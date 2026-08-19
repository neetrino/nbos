import { describe, expect, it } from 'vitest';
import {
  applyMailConnectPanelQuery,
  clearMailConnectPanelQuery,
  MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY,
  MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY,
} from './mail-query-params';

describe('mail connect query', () => {
  it('writes a new-connect flag without a reconnect id', () => {
    const params = new URLSearchParams();
    applyMailConnectPanelQuery(params);
    expect(params.get(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY)).toBe('1');
    expect(params.get(MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY)).toBeNull();
  });

  it('writes reconnect account id and clears the new-connect flag', () => {
    const params = new URLSearchParams(`${MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY}=1`);
    applyMailConnectPanelQuery(params, 'acc-1');
    expect(params.get(MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY)).toBe('acc-1');
    expect(params.get(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY)).toBeNull();
  });

  it('clears both connect query keys', () => {
    const params = new URLSearchParams(
      `${MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY}=1&${MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY}=acc-1`,
    );
    clearMailConnectPanelQuery(params);
    expect(params.get(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY)).toBeNull();
    expect(params.get(MAIL_OPEN_RECONNECT_MAILBOX_QUERY_KEY)).toBeNull();
  });
});
