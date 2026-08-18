import { describe, expect, it } from 'vitest';
import { buildImapFetchPlan, resolveImapLastUid } from './imap-fetch-plan';

describe('IMAP UIDVALIDITY reset', () => {
  it('resets lastUid and uses recovery window when UIDVALIDITY changes', () => {
    const lastUid = resolveImapLastUid({ imapUidValidity: '100', imapLastUid: '500' }, '200');
    expect(lastUid).toBe(0);
    expect(buildImapFetchPlan(lastUid, 80)).toEqual({ range: '51:*', useUid: false });
  });

  it('keeps incremental UID fetch when UIDVALIDITY is unchanged', () => {
    const lastUid = resolveImapLastUid({ imapUidValidity: '100', imapLastUid: '500' }, '100');
    expect(lastUid).toBe(500);
    expect(buildImapFetchPlan(lastUid, 80)).toEqual({ range: '501:*', useUid: true });
  });
});
