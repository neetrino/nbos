import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  decimalToNullableString,
  frozenDeliveryAxes,
  hasExplicitZeroRequiredUnits,
  isPublishedRoleVectorComplete,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';

@Injectable()
export class DeliveryCompensationRulesPublishService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async publishFunctionPrice(id: string, actorId: string, confirmZeroUnits = false) {
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.deliveryFunctionPriceVersion.findUnique({
        where: { id },
        include: { roleUnits: true },
      });
      if (!draft || draft.status !== 'DRAFT') {
        throw new NotFoundException('Draft price version not found');
      }
      const roleUnits = mapRoleUnits(draft.roleUnits);
      if (!isPublishedRoleVectorComplete(roleUnits)) {
        throw new BadRequestException('UNITS_NOT_CONFIGURED');
      }
      assertZeroUnitsConfirmed(roleUnits, confirmZeroUnits);
      await tx.deliveryFunctionPriceVersion.updateMany({
        where: {
          functionId: draft.functionId,
          tierId: draft.tierId,
          status: 'PUBLISHED',
        },
        data: { status: 'ARCHIVED' },
      });
      return tx.deliveryFunctionPriceVersion.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedAt: new Date(), publishedById: actorId },
        include: { roleUnits: true },
      });
    });
  }

  async publishRoleRate(id: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.deliveryRoleRateVersion.findUnique({ where: { id } });
      if (!draft || draft.status !== 'DRAFT') {
        throw new NotFoundException('Draft role rate not found');
      }
      await tx.deliveryRoleRateVersion.updateMany({
        where: { roleKey: draft.roleKey, status: 'PUBLISHED' },
        data: { status: 'ARCHIVED' },
      });
      return tx.deliveryRoleRateVersion.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedAt: new Date(), publishedById: actorId },
      });
    });
  }

  async publishBaseProfile(id: string, actorId: string, confirmZeroUnits = false) {
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.deliveryBaseProfileVersion.findUnique({
        where: { id },
        include: { roleUnits: true },
      });
      if (!draft || draft.status !== 'DRAFT') {
        throw new NotFoundException('Draft base profile not found');
      }
      const roleUnits = mapRoleUnits(draft.roleUnits);
      if (!isPublishedRoleVectorComplete(roleUnits)) {
        throw new BadRequestException('UNITS_NOT_CONFIGURED');
      }
      assertZeroUnitsConfirmed(roleUnits, confirmZeroUnits);
      await tx.deliveryBaseProfileVersion.updateMany({
        where: {
          status: 'PUBLISHED',
          OR: [{ profileKey: draft.profileKey }, { productType: draft.productType }],
        },
        data: { status: 'ARCHIVED' },
      });
      return tx.deliveryBaseProfileVersion.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedById: actorId,
          ...frozenDeliveryAxes(),
        },
        include: { roleUnits: true, includedFunctions: true },
      });
    });
  }
}

function mapRoleUnits(
  rows: Array<{ roleKey: string; unitKind: string; units: { toString(): string } | null }>,
) {
  return rows.map((row) => ({
    roleKey: row.roleKey,
    unitKind: row.unitKind,
    units: decimalToNullableString(row.units),
  })) as Parameters<typeof isPublishedRoleVectorComplete>[0];
}

function assertZeroUnitsConfirmed(
  rows: Parameters<typeof isPublishedRoleVectorComplete>[0],
  confirmZeroUnits: boolean,
): void {
  if (hasExplicitZeroRequiredUnits(rows) && !confirmZeroUnits) {
    throw new BadRequestException('ZERO_UNITS_CONFIRMATION_REQUIRED');
  }
}
