import { describe, expect, it } from 'vitest';
import {
  assertApprovalPayload,
  buildSafeApprovalSummary,
  canonicalizeApprovalPayload,
  isMaterialPayloadChange,
} from './approval-payload';
import { AI_APPROVAL_SUMMARY_MAX_CHARS } from './approval-types';

describe('approval payload digest binding', () => {
  it('canonicalizes key order so equivalent objects bind identically', () => {
    const left = canonicalizeApprovalPayload({ b: 2, a: { z: 1, y: 0 } });
    const right = canonicalizeApprovalPayload({ a: { y: 0, z: 1 }, b: 2 });
    expect(left).toBe(right);
    expect(isMaterialPayloadChange(left, { a: { y: 0, z: 1 }, b: 2 })).toBe(false);
  });

  it('treats recipient, amount, task and message content as material', () => {
    const stored = canonicalizeApprovalPayload({
      recipient: 'cust-a',
      amount: 10,
      taskId: 'task-1',
      body: 'hello',
    });
    expect(
      isMaterialPayloadChange(stored, {
        recipient: 'cust-b',
        amount: 10,
        taskId: 'task-1',
        body: 'hello',
      }),
    ).toBe(true);
    expect(
      isMaterialPayloadChange(stored, {
        recipient: 'cust-a',
        amount: 11,
        taskId: 'task-1',
        body: 'hello',
      }),
    ).toBe(true);
    expect(
      isMaterialPayloadChange(stored, {
        recipient: 'cust-a',
        amount: 10,
        taskId: 'task-2',
        body: 'hello',
      }),
    ).toBe(true);
    expect(
      isMaterialPayloadChange(stored, {
        recipient: 'cust-a',
        amount: 10,
        taskId: 'task-1',
        body: 'changed',
      }),
    ).toBe(true);
  });

  it('refuses secret-shaped payload fields including nested objects', () => {
    expect(assertApprovalPayload({ body: 'ok', metadata: { apiKey: 'secret' } })).toEqual({
      ok: false,
      reason: 'SECRET_FORBIDDEN',
    });
    expect(assertApprovalPayload({ body: 'ok' }).ok).toBe(true);
    expect(assertApprovalPayload(['not', 'an', 'object'])).toEqual({
      ok: false,
      reason: 'PAYLOAD_NOT_OBJECT',
    });
  });

  it('builds a truncated summary without secret keys', () => {
    const summary = buildSafeApprovalSummary({
      body: 'x'.repeat(AI_APPROVAL_SUMMARY_MAX_CHARS),
      token: 'should-not-appear',
    });
    expect(summary.includes('token')).toBe(false);
    expect(summary.endsWith('…')).toBe(true);
    expect(summary.length).toBe(AI_APPROVAL_SUMMARY_MAX_CHARS + 1);
  });
});
