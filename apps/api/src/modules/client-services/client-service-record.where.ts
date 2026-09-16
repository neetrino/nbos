import { BadRequestException } from '@nestjs/common';
import type {
  ClientServiceBillingModel,
  ClientServiceStatus,
  ClientServiceType,
  Prisma,
} from '@nbos/database';
import {
  requireClientServiceType,
  resolveClientServiceBillingModel,
  resolveClientServiceStatus,
} from './client-service-record-enum-validators';
import {
  buildClientServiceStageWhere,
  isClientServicePaymentStage,
} from './client-service-payment-stage';
import { CLIENT_SERVICE_SORT_FIELDS } from './client-services.helpers';
import type { ClientServiceRecordQueryParams } from './client-services.types';

export function buildClientServiceWhere(
  params: ClientServiceRecordQueryParams,
  now: Date,
): Prisma.ClientServiceRecordWhereInput {
  const base: Prisma.ClientServiceRecordWhereInput = {
    ...(params.projectId?.trim() ? { projectId: params.projectId.trim() } : {}),
    ...(params.productId?.trim() ? { productId: params.productId.trim() } : {}),
    ...(params.type?.trim()
      ? { type: requireClientServiceType(params.type) as ClientServiceType }
      : {}),
    ...buildClientServiceStatusWhere(params.status),
    ...(params.billingModel?.trim()
      ? {
          billingModel: resolveClientServiceBillingModel(
            params.billingModel,
          ) as ClientServiceBillingModel,
        }
      : {}),
    ...buildClientServiceSearchWhere(params.search),
    ...buildClientServiceRenewalWhere(params.renewalFrom, params.renewalTo),
  };

  const stage = params.stage?.trim();
  if (!stage) return base;
  if (!isClientServicePaymentStage(stage)) {
    throw new BadRequestException('stage is invalid');
  }
  return { AND: [base, buildClientServiceStageWhere(stage, now)] };
}

export function buildClientServiceOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
): Prisma.ClientServiceRecordOrderByWithRelationInput {
  const field = sortBy && CLIENT_SERVICE_SORT_FIELDS.has(sortBy) ? sortBy : 'renewalDate';
  return { [field]: sortOrder === 'desc' ? 'desc' : 'asc' };
}

export function resolveClientServiceStatsYear(year: number | undefined): number {
  if (Number.isInteger(year) && year && year >= 2000 && year <= 2100) return year;
  return new Date().getUTCFullYear();
}

function buildClientServiceStatusWhere(
  status: string | undefined,
): Prisma.ClientServiceRecordWhereInput {
  const raw = status?.trim();
  if (raw) {
    return { status: resolveClientServiceStatus(raw) as ClientServiceStatus };
  }
  return { status: { not: 'CANCELLED' } };
}

function buildClientServiceSearchWhere(
  search: string | undefined,
): Prisma.ClientServiceRecordWhereInput {
  const q = search?.trim();
  if (!q) return {};
  return {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { provider: { contains: q, mode: 'insensitive' } },
    ],
  };
}

function buildClientServiceRenewalWhere(
  from: string | undefined,
  to: string | undefined,
): Prisma.ClientServiceRecordWhereInput {
  const gte = from?.trim() ? new Date(from) : undefined;
  const lte = to?.trim() ? new Date(to) : undefined;
  if (gte && Number.isNaN(gte.getTime())) {
    throw new BadRequestException('renewalFrom is invalid');
  }
  if (lte && Number.isNaN(lte.getTime())) {
    throw new BadRequestException('renewalTo is invalid');
  }
  return gte || lte ? { renewalDate: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } } : {};
}
