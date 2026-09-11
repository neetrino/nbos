import { describe, expect, it, vi } from 'vitest';
import { isPrismaUniqueViolation } from '../../../common/prisma-unique-violation';
import { persistAtsCallByUid } from './ats-call-uid-persist';
import { inboundStart } from './ats-call.test-harness';

function uniqueError(target: string[] | string): {
  code: string;
  meta: { target: string[] | string };
} {
  return { code: 'P2002', meta: { target } };
}

const EXISTING = {
  id: 'evt-1',
  uid: 'uid-1',
  leadId: 'lead-1',
  contactId: null,
  dealId: null,
  responsibleEmployeeId: null,
  answeredEmployeeId: null,
  initiatedByEmployeeId: null,
};

describe('persistAtsCallByUid', () => {
  it('recovers a uid P2002 by loading the existing row and applying a sparse patch', async () => {
    const atsCallEvent = {
      create: vi.fn().mockRejectedValue(uniqueError(['uid'])),
      findUnique: vi.fn().mockResolvedValue(EXISTING),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };

    const result = await persistAtsCallByUid({ atsCallEvent } as never, inboundStart(), null);

    expect(atsCallEvent.create).toHaveBeenCalledOnce();
    expect(atsCallEvent.findUnique).toHaveBeenCalled();
    expect(atsCallEvent.updateMany).toHaveBeenCalled();
    expect(result.created).toBe(false);
    expect(result.stateTransitionApplied).toBe(true);
    expect(result.row.id).toBe('evt-1');
  });

  it('does not swallow a non-P2002 Prisma error', async () => {
    const atsCallEvent = {
      create: vi.fn().mockRejectedValue({ code: 'P2003', meta: { target: ['uid'] } }),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    };
    await expect(
      persistAtsCallByUid({ atsCallEvent } as never, inboundStart(), null),
    ).rejects.toEqual(expect.objectContaining({ code: 'P2003' }));
    expect(atsCallEvent.findUnique).not.toHaveBeenCalled();
  });

  it('does not treat a P2002 on another field as uid recovery', async () => {
    const atsCallEvent = {
      create: vi.fn().mockRejectedValue(uniqueError(['recordingFileAssetId'])),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    };
    await expect(
      persistAtsCallByUid({ atsCallEvent } as never, inboundStart(), null),
    ).rejects.toEqual(expect.objectContaining({ code: 'P2002' }));
    expect(atsCallEvent.findUnique).not.toHaveBeenCalled();
  });

  it('does not swallow a uid P2002 on update when recovery cannot load another row', async () => {
    const atsCallEvent = {
      create: vi.fn(),
      findUnique: vi.fn().mockResolvedValue(EXISTING),
      updateMany: vi.fn().mockRejectedValue(uniqueError(['uid'])),
    };
    await expect(
      persistAtsCallByUid({ atsCallEvent } as never, inboundStart(), EXISTING),
    ).rejects.toEqual(expect.objectContaining({ code: 'P2002' }));
  });
});

describe('isPrismaUniqueViolation', () => {
  it('requires P2002 and the expected unique fields', () => {
    expect(isPrismaUniqueViolation(uniqueError(['uid']), ['uid'])).toBe(true);
    expect(isPrismaUniqueViolation(uniqueError('ats_call_events_uid_key'), ['uid'])).toBe(true);
    expect(
      isPrismaUniqueViolation(uniqueError(['employee_id', 'idempotency_key']), [
        'employeeId',
        'idempotencyKey',
      ]),
    ).toBe(true);
    expect(isPrismaUniqueViolation({ code: 'P2025' }, ['uid'])).toBe(false);
  });
});
