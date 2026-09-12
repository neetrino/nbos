import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateWallpaperUpload } from './platform-appearance-validate';

function buildVp8x(width: number, height: number, animated = false): Uint8Array {
  const payload = Buffer.alloc(10);
  payload[0] = animated ? 0x02 : 0x00;
  writeU24Le(payload, 4, width - 1);
  writeU24Le(payload, 7, height - 1);
  const chunk = Buffer.alloc(18);
  chunk.write('VP8X', 0, 'ascii');
  chunk.writeUInt32LE(10, 4);
  payload.copy(chunk, 8);
  const body = Buffer.alloc(12 + chunk.length);
  body.write('RIFF', 0, 'ascii');
  body.writeUInt32LE(body.length - 8, 4);
  body.write('WEBP', 8, 'ascii');
  chunk.copy(body, 12);
  return body;
}

function writeU24Le(target: Buffer, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
  target[offset + 2] = (value >> 16) & 0xff;
}

describe('validateWallpaperUpload', () => {
  it('accepts a still WebP inside the size window', () => {
    const bytes = buildVp8x(1920, 1280);
    const result = validateWallpaperUpload({
      originalName: 'desk.webp',
      mimeType: 'image/webp',
      bytes,
    });
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1280);
  });

  it('rejects animation, jpeg names, and oversized edges', () => {
    expect(() =>
      validateWallpaperUpload({
        originalName: 'desk.webp',
        mimeType: 'image/webp',
        bytes: buildVp8x(1920, 1280, true),
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      validateWallpaperUpload({
        originalName: 'desk.jpg',
        mimeType: 'image/webp',
        bytes: buildVp8x(1920, 1280),
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      validateWallpaperUpload({
        originalName: 'desk.webp',
        mimeType: 'image/webp',
        bytes: buildVp8x(3000, 2000),
      }),
    ).toThrow(BadRequestException);
  });
});
