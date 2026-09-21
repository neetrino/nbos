import { BadRequestException } from '@nestjs/common';

export function requireText(value: string | undefined, field: string) {
  const text = value?.trim();
  if (!text) throw new BadRequestException(`${field} is required`);
  return text;
}

export function parseDate(value: string | undefined, field: string) {
  const raw = requireText(value, field);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} is invalid`);
  return date;
}
