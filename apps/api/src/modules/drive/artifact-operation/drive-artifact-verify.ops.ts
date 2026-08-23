import { BadRequestException } from '@nestjs/common';
import type { ArtifactOperationRow } from './drive-artifact-operation.row';
import { assertUploadSizeWithinLimit } from '../drive-upload-validation';
import type { ArtifactObjectHead, FinalizeHints } from './drive-artifact-operation.types';
import { toNumberOrNull } from './drive-artifact-operation.mapper';

export function verifyArtifactObject(
  operation: ArtifactOperationRow,
  head: ArtifactObjectHead | null,
  hints: FinalizeHints,
): { sizeBytes: number; checksum: string | null } {
  if (!head) {
    throw new BadRequestException('File was not found in storage.');
  }
  assertUploadSizeWithinLimit(head.contentLength);
  const expected = toNumberOrNull(operation.expectedSizeBytes);
  if (expected !== null && head.contentLength !== null && expected !== head.contentLength) {
    throw new BadRequestException('Uploaded object size does not match the declared size.');
  }
  if (
    hints.sizeBytes !== null &&
    hints.sizeBytes !== undefined &&
    head.contentLength !== null &&
    hints.sizeBytes !== head.contentLength
  ) {
    throw new BadRequestException('Uploaded object size does not match the completion size.');
  }
  if (
    operation.mimeType &&
    head.contentType &&
    normalizeMime(operation.mimeType) !== normalizeMime(head.contentType)
  ) {
    throw new BadRequestException('Uploaded object MIME type does not match the declared type.');
  }
  const checksum = hints.checksum ?? operation.checksum;
  return {
    sizeBytes: head.contentLength ?? hints.sizeBytes ?? expected ?? 0,
    checksum,
  };
}

function normalizeMime(value: string): string {
  return value.split(';')[0]?.trim().toLowerCase() ?? '';
}
