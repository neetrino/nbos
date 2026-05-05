import { BadRequestException } from '@nestjs/common';
import {
  Decimal,
  type PartnerTypeEnum,
  type PartnerDirectionEnum,
  type PartnerStatusEnum,
} from '@nbos/database';
import type { Prisma } from '@nbos/database';

const PARTNER_LEVELS = new Set<string>(['REGULAR', 'PREMIUM']);
const PARTNER_DIRECTIONS = new Set<string>(['INBOUND', 'OUTBOUND', 'BOTH']);
const PARTNER_STATUSES = new Set<string>(['ACTIVE', 'INACTIVE']);

export type PartnerWireRow = Prisma.PartnerGetPayload<{
  include: {
    _count: { select: { subscriptions: true; orders: true } };
    contact: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

export interface PartnerWireDto {
  id: string;
  name: string;
  /** NBOS: partner tier (Prisma `Partner.type` / REGULAR | PREMIUM). */
  level: PartnerTypeEnum;
  direction: PartnerDirectionEnum;
  defaultPercent: string;
  status: PartnerStatusEnum;
  contactId: string | null;
  createdAt: string;
  updatedAt: string;
  contact: { id: string; firstName: string; lastName: string } | null;
  _count: { subscriptions: number; orders: number };
}

function assertEnum(label: string, value: string, allowed: Set<string>): void {
  if (!allowed.has(value)) {
    throw new BadRequestException(`${label} must be one of: ${[...allowed].join(', ')}`);
  }
}

export function resolvePartnerLevelFilter(
  level?: string,
  typeAlias?: string,
): PartnerTypeEnum | undefined {
  const raw = level?.trim() || typeAlias?.trim();
  if (!raw) return undefined;
  assertEnum('level', raw, PARTNER_LEVELS);
  return raw as PartnerTypeEnum;
}

export function resolvePartnerDirectionFilter(raw?: string): PartnerDirectionEnum | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  assertEnum('direction', v, PARTNER_DIRECTIONS);
  return v as PartnerDirectionEnum;
}

export function resolvePartnerStatusFilter(raw?: string): PartnerStatusEnum | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  assertEnum('status', v, PARTNER_STATUSES);
  return v as PartnerStatusEnum;
}

export function parsePartnerLevelForWrite(
  level?: string,
  typeAlias?: string,
): PartnerTypeEnum | undefined {
  const raw = level?.trim() || typeAlias?.trim();
  if (!raw) return undefined;
  assertEnum('level', raw, PARTNER_LEVELS);
  return raw as PartnerTypeEnum;
}

export function parsePartnerDirectionForWrite(raw?: string): PartnerDirectionEnum | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  assertEnum('direction', v, PARTNER_DIRECTIONS);
  return v as PartnerDirectionEnum;
}

export function parsePartnerStatusForWrite(raw?: string): PartnerStatusEnum | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  assertEnum('status', v, PARTNER_STATUSES);
  return v as PartnerStatusEnum;
}

function decimalToMoneyString(value: Decimal): string {
  return value.toFixed(2);
}

export function serializePartner(row: PartnerWireRow): PartnerWireDto {
  return {
    id: row.id,
    name: row.name,
    level: row.type,
    direction: row.direction,
    defaultPercent: decimalToMoneyString(row.defaultPercent),
    status: row.status,
    contactId: row.contactId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    contact: row.contact,
    _count: row._count,
  };
}
