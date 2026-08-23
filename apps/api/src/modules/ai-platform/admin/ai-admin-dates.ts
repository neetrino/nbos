import { BadRequestException } from '@nestjs/common';

/** Parses an optional ISO timestamp. `null` clears the field; `undefined` leaves it. */
export function parseOptionalIsoDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value.trim() === '') {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Invalid date');
  }
  return parsed;
}
