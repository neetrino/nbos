import { BadRequestException } from '@nestjs/common';
import { SENSITIVE_FIELDS, type SensitiveField } from './credential-domain.types';

export function isSensitiveField(value: string): value is SensitiveField {
  return (SENSITIVE_FIELDS as readonly string[]).includes(value);
}

export function parseSecretField(field: string): SensitiveField {
  if (!isSensitiveField(field)) {
    throw new BadRequestException(`Invalid secret field; allowed: ${SENSITIVE_FIELDS.join(', ')}`);
  }
  return field;
}
