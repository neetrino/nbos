import { describe, expect, it } from 'vitest';
import { AUDIT_REDACTED_VALUE, redactAuditChanges } from './audit-changes-redact';

describe('redactAuditChanges', () => {
  it('leaves field-name lists intact', () => {
    expect(redactAuditChanges(['name', 'password'])).toEqual(['name', 'password']);
  });

  it('redacts bearer tokens and provider keys', () => {
    expect(
      redactAuditChanges({
        authorization: 'Bearer secret-token',
        apiKey: 'sk-live',
        providerKey: 'anth-key',
        name: 'ok',
      }),
    ).toEqual({
      authorization: AUDIT_REDACTED_VALUE,
      apiKey: AUDIT_REDACTED_VALUE,
      providerKey: AUDIT_REDACTED_VALUE,
      name: 'ok',
    });
  });

  it('redacts prompt/context payloads by default', () => {
    expect(redactAuditChanges({ prompt: 'system + user dump', title: 'Task' })).toEqual({
      prompt: AUDIT_REDACTED_VALUE,
      title: 'Task',
    });
  });

  it('recurses into nested objects', () => {
    expect(redactAuditChanges({ nested: { token: 'abc' } })).toEqual({
      nested: { token: AUDIT_REDACTED_VALUE },
    });
  });
});
