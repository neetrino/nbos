import { describe, expect, it } from 'vitest';
import { buildMessengerDeltaChangeSql } from './messenger-core-delta-sql';

function sqlText(fragment: unknown): string {
  if (fragment && typeof fragment === 'object' && 'strings' in fragment) {
    return (fragment as { strings: readonly string[] }).strings.join(' ');
  }
  return JSON.stringify(fragment);
}

describe('Messenger delta change SQL', () => {
  it('scans zone+revision and employee+zone+revision without sensitive payloads', () => {
    const text = sqlText(
      buildMessengerDeltaChangeSql({
        zone: 'INTERNAL',
        employeeId: 'e1',
        after: '3',
        highWater: '10',
        pageSize: 50,
      }),
    );
    expect(text).toMatch(/messenger_conversation_revisions/);
    expect(text).toMatch(/messenger_employee_conversation_revisions/);
    expect(text).toMatch(/FULL OUTER JOIN/);
    expect(text).toMatch(/has_access_removed/);
    expect(text).toMatch(/ORDER BY revision ASC, conversation_id ASC/);
    expect(text).toMatch(/employee_id/);
    expect(text).not.toMatch(/nextval/);
    expect(text).not.toMatch(/body|preview|title|payload|secret/i);
  });

  it('uses exclusive revision then conversation-id continuation so pages neither skip nor repeat', () => {
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const text = sqlText(
      buildMessengerDeltaChangeSql({
        zone: 'CLIENT',
        employeeId: 'e1',
        after: '0',
        highWater: '10',
        cursor: { highWater: '10', revision: '4', conversationId: id },
        pageSize: 50,
      }),
    );
    expect(text).toMatch(/revision >/);
    expect(text).toMatch(/conversation_id >/);
  });
});
