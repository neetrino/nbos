import { describe, expect, it } from 'vitest';
import { nextHistoryPageStart, toAtsHistoryYmd } from './ats-history.client';

describe('toAtsHistoryYmd', () => {
  it('uses Asia/Yerevan calendar date', () => {
    expect(toAtsHistoryYmd(new Date('2026-08-24T17:43:29.212Z'))).toBe('2026-08-24');
    expect(toAtsHistoryYmd(new Date('2026-08-23T21:30:00.000Z'))).toBe('2026-08-24');
  });
});

describe('nextHistoryPageStart', () => {
  it('skips a second page when the first page covers the day', () => {
    expect(nextHistoryPageStart(120, 200)).toBeNull();
  });

  it('starts the second fetch at the latest page', () => {
    expect(nextHistoryPageStart(500, 200)).toBe(300);
  });
});
