import { describe, expect, it } from 'vitest';
import { isS3RangeNotSatisfiable } from './calls-recording-s3-error';

describe('isS3RangeNotSatisfiable', () => {
  it('detects HTTP 416 and InvalidRange codes', () => {
    expect(isS3RangeNotSatisfiable({ $metadata: { httpStatusCode: 416 } })).toBe(true);
    expect(isS3RangeNotSatisfiable({ name: 'InvalidRange' })).toBe(true);
    expect(isS3RangeNotSatisfiable({ Code: 'InvalidRangeException' })).toBe(true);
    expect(isS3RangeNotSatisfiable({ $metadata: { httpStatusCode: 404 } })).toBe(false);
    expect(isS3RangeNotSatisfiable(new Error('network'))).toBe(false);
  });
});
