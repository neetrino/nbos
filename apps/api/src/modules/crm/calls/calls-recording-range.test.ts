import { describe, expect, it } from 'vitest';
import {
  parseSingleByteRange,
  recordingContentRange,
  r2ByteRangeHeader,
  toSafeByteLength,
  unsatisfiableContentRange,
} from './calls-recording-range';

describe('parseSingleByteRange', () => {
  const TOTAL = 34776;

  it('returns none when Range is absent or malformed', () => {
    expect(parseSingleByteRange(undefined, TOTAL)).toEqual({ kind: 'none' });
    expect(parseSingleByteRange('', TOTAL)).toEqual({ kind: 'none' });
    expect(parseSingleByteRange('bytes=0-1,2-3', TOTAL)).toEqual({ kind: 'none' });
    expect(parseSingleByteRange('items=1-2', TOTAL)).toEqual({ kind: 'none' });
  });

  it('parses open-ended and bounded ranges', () => {
    expect(parseSingleByteRange('bytes=0-', TOTAL)).toEqual({
      kind: 'range',
      start: 0,
      end: TOTAL - 1,
    });
    expect(parseSingleByteRange('bytes=100-199', TOTAL)).toEqual({
      kind: 'range',
      start: 100,
      end: 199,
    });
    expect(parseSingleByteRange('bytes=34700-999999', TOTAL)).toEqual({
      kind: 'range',
      start: 34700,
      end: TOTAL - 1,
    });
  });

  it('parses suffix ranges', () => {
    expect(parseSingleByteRange('bytes=-500', TOTAL)).toEqual({
      kind: 'range',
      start: TOTAL - 500,
      end: TOTAL - 1,
    });
    expect(parseSingleByteRange('bytes=-999999', TOTAL)).toEqual({
      kind: 'range',
      start: 0,
      end: TOTAL - 1,
    });
  });

  it('returns 416-equivalent unsatisfiable ranges', () => {
    expect(parseSingleByteRange('bytes=34776-', TOTAL)).toEqual({ kind: 'unsatisfiable' });
    expect(parseSingleByteRange('bytes=200-100', TOTAL)).toEqual({ kind: 'unsatisfiable' });
    expect(parseSingleByteRange('bytes=-0', TOTAL)).toEqual({ kind: 'unsatisfiable' });
    expect(parseSingleByteRange('bytes=0-10', 0)).toEqual({ kind: 'unsatisfiable' });
  });
});

describe('recording range helpers', () => {
  it('formats Content-Range and R2 Range values', () => {
    expect(recordingContentRange(0, 10, 34776)).toBe('bytes 0-10/34776');
    expect(unsatisfiableContentRange(34776)).toBe('bytes */34776');
    expect(r2ByteRangeHeader({ start: 0, end: 99 })).toBe('bytes=0-99');
  });

  it('accepts FileAsset bigint sizes only when they are safe lengths', () => {
    expect(toSafeByteLength(34776n)).toBe(34776);
    expect(toSafeByteLength(-1)).toBeNull();
    expect(toSafeByteLength(null)).toBeNull();
  });
});
