import { describe, expect, it } from 'vitest';
import { EMPLOYEE_AVATAR_MAX_BYTES } from './employee-avatar.constants';
import { validateEmployeeAvatarUpload } from './employee-avatar-validate';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe('validateEmployeeAvatarUpload', () => {
  it('accepts JPEG, PNG, and WebP magic bytes', () => {
    expect(
      validateEmployeeAvatarUpload({ originalName: 'a.jpg', mimeType: 'image/jpeg', bytes: JPEG })
        .extension,
    ).toBe('jpg');
    expect(
      validateEmployeeAvatarUpload({ originalName: 'a.png', mimeType: 'image/png', bytes: PNG })
        .mimeType,
    ).toBe('image/png');
    expect(
      validateEmployeeAvatarUpload({ originalName: 'a.webp', mimeType: 'image/webp', bytes: WEBP })
        .mimeType,
    ).toBe('image/webp');
  });

  it('rejects empty, oversized, and non-image payloads', () => {
    expect(() =>
      validateEmployeeAvatarUpload({
        originalName: 'a.jpg',
        mimeType: 'image/jpeg',
        bytes: new Uint8Array(),
      }),
    ).toThrow(/JPEG, PNG, or WebP/);
    expect(() =>
      validateEmployeeAvatarUpload({
        originalName: 'a.bin',
        mimeType: 'application/octet-stream',
        bytes: new Uint8Array([0x00, 0x01, 0x02, 0x03]),
      }),
    ).toThrow(/not a valid/);
    const oversized = new Uint8Array(EMPLOYEE_AVATAR_MAX_BYTES + 1);
    oversized.set(JPEG, 0);
    expect(() =>
      validateEmployeeAvatarUpload({
        originalName: 'a.jpg',
        mimeType: 'image/jpeg',
        bytes: oversized,
      }),
    ).toThrow(/at most/);
  });
});
