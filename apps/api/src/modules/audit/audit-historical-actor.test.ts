import { describe, expect, it } from 'vitest';
import {
  backfillHistoricalAuditActor,
  resolveHistoricalAuditActor,
} from './audit-historical-actor';

describe('historical AuditLog actor backfill', () => {
  it('treats pre-migration employee rows as USER', () => {
    const row = { userId: 'emp-1', actorType: null, actorId: null };
    expect(resolveHistoricalAuditActor(row)).toEqual({ type: 'USER', id: 'emp-1' });
    expect(backfillHistoricalAuditActor(row)).toEqual({
      actorType: 'USER',
      actorId: 'emp-1',
      userId: 'emp-1',
    });
  });

  it('keeps non-employee historical userId values without inventing a new principal', () => {
    const productIdUsedAsUserId = 'prod-whatsapp-1';
    expect(backfillHistoricalAuditActor({ userId: productIdUsedAsUserId })).toEqual({
      actorType: 'USER',
      actorId: productIdUsedAsUserId,
      userId: productIdUsedAsUserId,
    });
  });

  it('preserves already backfilled or machine-written rows', () => {
    expect(
      resolveHistoricalAuditActor({
        userId: null,
        actorType: 'EXTERNAL_AGENT',
        actorId: 'agent-1',
      }),
    ).toEqual({ type: 'EXTERNAL_AGENT', id: 'agent-1' });
  });

  it('returns null when no identity exists', () => {
    expect(
      resolveHistoricalAuditActor({ userId: null, actorType: null, actorId: null }),
    ).toBeNull();
  });
});
