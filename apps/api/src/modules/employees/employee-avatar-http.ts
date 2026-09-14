import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EMPLOYEE_AVATAR_MAX_BYTES } from './employee-avatar.constants';

export type EmployeeAvatarMemoryUpload = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

export const EMPLOYEE_AVATAR_FILE_INTERCEPTOR_OPTIONS = {
  limits: { fileSize: EMPLOYEE_AVATAR_MAX_BYTES },
} as const;

export function requireEmployeeAvatarUpload(file: EmployeeAvatarMemoryUpload | undefined): {
  originalName: string;
  mimeType: string;
  bytes: Uint8Array;
} {
  if (!file?.buffer?.byteLength) {
    throw new BadRequestException('Choose a JPEG, PNG, or WebP photo.');
  }
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    bytes: file.buffer,
  };
}

export function requireEmployeeId(userId: string | undefined): string {
  if (!userId) {
    throw new NotFoundException('Employee record not found for this user');
  }
  return userId;
}
