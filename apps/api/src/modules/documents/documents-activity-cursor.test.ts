import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  decodeDocumentActivityCursor,
  encodeDocumentActivityCursor,
} from './documents-activity-cursor';

describe('documents-activity-cursor', () => {
  it('round-trips createdAt and id', () => {
    const createdAt = new Date('2026-01-15T08:30:00.123Z');
    const id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
    const token = encodeDocumentActivityCursor(createdAt, id);
    const decoded = decodeDocumentActivityCursor(token);
    expect(decoded.id).toBe(id);
    expect(decoded.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it('rejects malformed cursor', () => {
    expect(() => decodeDocumentActivityCursor('not-base64!!!')).toThrow(BadRequestException);
  });
});
