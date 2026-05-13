import { BadRequestException } from '@nestjs/common';
import {
  Decimal,
  type PartnerAgreementStatusEnum,
  type PartnerTypeEnum,
  type PartnerDirectionEnum,
  type PartnerStatusEnum,
} from '@nbos/database';
import type { Prisma } from '@nbos/database';

const PARTNER_LEVELS = new Set<string>(['REGULAR', 'PREMIUM']);
const PARTNER_DIRECTIONS = new Set<string>(['INBOUND', 'OUTBOUND', 'BOTH']);
const PARTNER_STATUSES = new Set<string>(['ACTIVE', 'PAUSED', 'TERMINATED']);
const PARTNER_AGREEMENT_STATUSES = new Set<string>(['NO_AGREEMENT', 'DRAFT', 'ACTIVE', 'EXPIRED']);

export const PARTNER_WIRE_INCLUDE = {
  _count: { select: { subscriptions: true, orders: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  agreementFileAsset: { select: { id: true, displayName: true } },
  agreementOwner: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.PartnerInclude;

export type PartnerWireRow = Prisma.PartnerGetPayload<{
  include: typeof PARTNER_WIRE_INCLUDE;
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
  notes: string | null;
  startDate: string | null;
  agreementStatus: PartnerAgreementStatusEnum;
  agreementStartDate: string | null;
  agreementEndDate: string | null;
  agreementSpecialTerms: string | null;
  agreementFileAssetId: string | null;
  agreementFileAsset: { id: string; displayName: string } | null;
  agreementOwnerId: string | null;
  agreementOwner: { id: string; firstName: string; lastName: string } | null;
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

export function parsePartnerAgreementStatusForWrite(
  raw?: string,
): PartnerAgreementStatusEnum | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  assertEnum('agreementStatus', v, PARTNER_AGREEMENT_STATUSES);
  return v as PartnerAgreementStatusEnum;
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
    notes: row.notes,
    startDate: row.startDate?.toISOString() ?? null,
    agreementStatus: row.agreementStatus,
    agreementStartDate: row.agreementStartDate?.toISOString() ?? null,
    agreementEndDate: row.agreementEndDate?.toISOString() ?? null,
    agreementSpecialTerms: row.agreementSpecialTerms,
    agreementFileAssetId: row.agreementFileAssetId,
    agreementFileAsset: row.agreementFileAsset,
    agreementOwnerId: row.agreementOwnerId,
    agreementOwner: row.agreementOwner,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    contact: row.contact,
    _count: row._count,
  };
}
