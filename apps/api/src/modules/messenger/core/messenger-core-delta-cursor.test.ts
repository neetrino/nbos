import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  encodeMessengerDeltaCursor,
  parseMessengerCheckpoint,
  parseMessengerDeltaCursor,
} from './messenger-core-delta-cursor';

describe('Messenger delta checkpoint and cursor', () => {
  it('accepts non-negative decimal checkpoints and rejects unsafe values', () => {
    expect(parseMessengerCheckpoint('0')).toBe(0n);
    expect(parseMessengerCheckpoint('12')).toBe(12n);
    expect(() => parseMessengerCheckpoint('-1')).toThrow(BadRequestException);
    expect(() => parseMessengerCheckpoint('1e2')).toThrow(BadRequestException);
    expect(() => parseMessengerCheckpoint('0x10')).toThrow(BadRequestException);
    expect(() => parseMessengerCheckpoint('01')).toThrow(BadRequestException);
    expect(() => parseMessengerCheckpoint('999999999999999999999')).toThrow(BadRequestException);
  });

  it('parses a stable continuation and rejects malformed or huge cursors', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const encoded = encodeMessengerDeltaCursor({
      highWater: '40',
      revision: '12',
      conversationId: id,
    });
    expect(parseMessengerDeltaCursor(encoded)).toEqual({
      highWater: '40',
      revision: '12',
      conversationId: id,
    });
    expect(() => parseMessengerDeltaCursor('nope')).toThrow(BadRequestException);
    expect(() => parseMessengerDeltaCursor(`${'9'.repeat(200)}|1|${id}`)).toThrow(
      BadRequestException,
    );
    expect(() => parseMessengerDeltaCursor(`40|12|not-a-uuid`)).toThrow(BadRequestException);
  });
});
