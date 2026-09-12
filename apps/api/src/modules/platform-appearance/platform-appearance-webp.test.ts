import { describe, expect, it } from 'vitest';
import { sniffWebpImage } from './platform-appearance-webp';

function buildVp8x(width: number, height: number, animated: boolean): Uint8Array {
  const payload = Buffer.alloc(10);
  payload[0] = animated ? 0x02 : 0x00;
  writeU24Le(payload, 4, width - 1);
  writeU24Le(payload, 7, height - 1);
  return wrapRiff('VP8X', payload);
}

function wrapRiff(fourcc: string, payload: Buffer): Uint8Array {
  const chunk = Buffer.alloc(8 + payload.length);
  chunk.write(fourcc, 0, 'ascii');
  chunk.writeUInt32LE(payload.length, 4);
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

describe('sniffWebpImage', () => {
  it('reads VP8X canvas size', () => {
    expect(sniffWebpImage(buildVp8x(1920, 1080, false))).toEqual({
      width: 1920,
      height: 1080,
      animated: false,
    });
  });

  it('flags animated VP8X', () => {
    expect(sniffWebpImage(buildVp8x(1280, 720, true))?.animated).toBe(true);
  });

  it('rejects non-webp bytes', () => {
    expect(sniffWebpImage(Buffer.from('not-an-image'))).toBeNull();
  });
});
