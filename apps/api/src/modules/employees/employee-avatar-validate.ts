import { BadRequestException } from '@nestjs/common';
import { EMPLOYEE_AVATAR_MAX_BYTES, type EmployeeAvatarMime } from './employee-avatar.constants';

export type ValidatedEmployeeAvatar = {
  bytes: Uint8Array;
  mimeType: EmployeeAvatarMime;
  extension: 'jpg' | 'png' | 'webp';
  originalName: string;
};

type AvatarUploadInput = {
  originalName: string;
  mimeType: string;
  bytes: Uint8Array;
};

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

/** Rejects empty, oversized, or non-image payloads using magic bytes, not the filename. */
export function validateEmployeeAvatarUpload(input: AvatarUploadInput): ValidatedEmployeeAvatar {
  if (input.bytes.byteLength === 0) {
    throw new BadRequestException('Choose a JPEG, PNG, or WebP photo.');
  }
  if (input.bytes.byteLength > EMPLOYEE_AVATAR_MAX_BYTES) {
    throw new BadRequestException(
      `Photo must be at most ${Math.floor(EMPLOYEE_AVATAR_MAX_BYTES / (1024 * 1024))} MB.`,
    );
  }
  const sniffed = sniffEmployeeAvatarImage(input.bytes);
  if (!sniffed) {
    throw new BadRequestException('File is not a valid JPEG, PNG, or WebP image.');
  }
  return {
    bytes: input.bytes,
    mimeType: sniffed.mimeType,
    extension: sniffed.extension,
    originalName: input.originalName.trim() || `avatar.${sniffed.extension}`,
  };
}

function sniffEmployeeAvatarImage(
  bytes: Uint8Array,
): { mimeType: EmployeeAvatarMime; extension: 'jpg' | 'png' | 'webp' } | null {
  if (startsWith(bytes, JPEG_SIGNATURE)) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  if (startsWith(bytes, PNG_SIGNATURE)) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  if (isWebpImage(bytes)) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }
  return null;
}

function isWebpImage(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12) return false;
  const riff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return riff && webp;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.byteLength < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}
