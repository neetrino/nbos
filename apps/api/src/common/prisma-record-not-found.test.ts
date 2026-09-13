import { describe, expect, it } from 'vitest';
import { isPrismaRecordNotFound } from './prisma-record-not-found';

describe('isPrismaRecordNotFound', () => {
  it('accepts Prisma P2025', () => {
    expect(isPrismaRecordNotFound({ code: 'P2025' })).toBe(true);
  });

  it('rejects other Prisma codes and plain errors', () => {
    expect(isPrismaRecordNotFound({ code: 'P2002' })).toBe(false);
    expect(isPrismaRecordNotFound(new Error('db down'))).toBe(false);
    expect(isPrismaRecordNotFound(null)).toBe(false);
  });
});
