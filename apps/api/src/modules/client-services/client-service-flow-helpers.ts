import { BadRequestException } from '@nestjs/common';
import type { ClientServiceType, ExpenseCategoryEnum, InvoiceTypeEnum } from '@nbos/database';

export const CLIENT_SERVICE_TASK_ENTITY_TYPE = 'ClientServiceRecord';

export function requirePositiveAmount(value: number | null | undefined, field: string): number {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    throw new BadRequestException(`${field} must be greater than zero`);
  }
  return value;
}

export function clientServiceInvoiceType(type: ClientServiceType): InvoiceTypeEnum {
  return type === 'DOMAIN' ? 'DOMAIN' : 'SERVICE';
}

export function clientServiceExpenseCategory(type: ClientServiceType): ExpenseCategoryEnum {
  if (type === 'DOMAIN') return 'DOMAIN';
  if (type === 'HOSTING') return 'HOSTING';
  return 'SERVICE';
}

export function clientServiceTaskTitle(name: string, type: ClientServiceType): string {
  const normalizedType = type.charAt(0) + type.slice(1).toLowerCase();
  return `Purchase / renew ${normalizedType}: ${name}`;
}

export const CLIENT_SERVICE_OPEN_TASK_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'REVIEW',
  'ON_HOLD',
] as const;

export function formatClientServiceExpenseNotes(serviceName: string, invoiceId: string): string {
  return `From client service: ${serviceName}; NBOS invoiceId=${invoiceId}`;
}

export function formatClientServiceTaskDescription(
  service: { id: string; provider: string | null },
  invoiceId: string,
): string {
  const provider = service.provider ? `Provider: ${service.provider}` : 'Provider is not set';
  return `${provider}. Linked to client service ${service.id}. Triggered by paid invoice ${invoiceId}.`;
}
