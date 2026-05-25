import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { orderWhereForPoolKey, parseBonusPoolKey } from './bonus-pool-key';

describe('parseBonusPoolKey', () => {
  it('parses product key', () => {
    expect(parseBonusPoolKey('product:abc')).toEqual({
      kind: 'PRODUCT',
      productId: 'abc',
    });
  });

  it('parses extension key', () => {
    expect(parseBonusPoolKey('extension:ex1')).toEqual({
      kind: 'EXTENSION',
      extensionId: 'ex1',
    });
  });

  it('throws on invalid key', () => {
    expect(() => parseBonusPoolKey('bad')).toThrow(BadRequestException);
  });
});

describe('orderWhereForPoolKey', () => {
  it('maps to product filter', () => {
    expect(orderWhereForPoolKey('product:p1')).toEqual({ productId: 'p1' });
  });
});
