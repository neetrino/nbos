import { BadRequestException } from '@nestjs/common';
import type { LifecycleTimestampField } from '@nbos/shared';

type TrashTimestampRow = Partial<Record<LifecycleTimestampField, Date | string | null | undefined>>;

function readTrashTimestamp(
  row: TrashTimestampRow,
  field: LifecycleTimestampField,
): Date | string | null | undefined {
  return row[field];
}

function isTrashed(row: TrashTimestampRow, field: LifecycleTimestampField): boolean {
  const value = readTrashTimestamp(row, field);
  return value != null;
}

/**
 * Ensures the record is active (not in Trash). Throws when already trashed.
 */
export function assertEntityIsActive(
  row: TrashTimestampRow,
  field: LifecycleTimestampField = 'trashedAt',
  label = 'Entity',
): void {
  if (isTrashed(row, field)) {
    throw new BadRequestException(`${label} is in Trash and cannot be modified this way.`);
  }
}

/**
 * Ensures the record is in Trash. Throws when still active.
 */
export function assertEntityIsTrashed(
  row: TrashTimestampRow,
  field: LifecycleTimestampField = 'trashedAt',
  label = 'Entity',
): void {
  if (!isTrashed(row, field)) {
    throw new BadRequestException(`${label} is not in Trash.`);
  }
}
