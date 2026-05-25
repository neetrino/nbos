import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { BONUS_POOL_LINES_BATCH_MAX, parsePoolKeysQuery } from './bonus-pool-lines-batch';

describe('parsePoolKeysQuery', () => {
  it('parses comma-separated keys', () => {
    expect(parsePoolKeysQuery('product:a, extension:b')).toEqual(['product:a', 'extension:b']);
  });

  it('deduplicates keys', () => {
    expect(parsePoolKeysQuery('product:a,product:a')).toEqual(['product:a']);
  });

  it('throws when empty', () => {
    expect(() => parsePoolKeysQuery('')).toThrow(BadRequestException);
  });

  it('throws when over max', () => {
    const keys = Array.from({ length: BONUS_POOL_LINES_BATCH_MAX + 1 }, (_, i) => `product:${i}`);
    expect(() => parsePoolKeysQuery(keys.join(','))).toThrow(BadRequestException);
  });
});
