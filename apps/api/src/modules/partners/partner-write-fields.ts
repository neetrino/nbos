import { BadRequestException } from '@nestjs/common';

export function parseOptionalIsoDate(value: string | undefined, field: string): Date | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`${field} must be a valid ISO date`);
  }
  return d;
}

/** `undefined` = omit patch; `null` / empty string = clear. */
export function parseNullableIsoDate(
  value: string | null | undefined,
  field: string,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`${field} must be a valid ISO date`);
  }
  return d;
}
