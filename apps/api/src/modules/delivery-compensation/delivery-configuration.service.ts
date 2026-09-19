import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { applyEmployeeReplacement } from './apply-employee-replacement';
import { applyScopeAddFeature } from './apply-scope-add-feature';
import { applyScopeRemoveFeature } from './apply-scope-remove-feature';
import { DELIVERY_COMPENSATION_ROLE_KEYS, type DeliveryCompensationRoleKey } from '@nbos/shared';
import type { ReplacementShareInput } from './apply-employee-replacement';
import { attachConfigurationReadiness } from './attach-configuration-readiness';
import { isPrismaUniqueConstraint } from './prisma-unique';
import { syncProductBonusPoolForOrder } from '../bonus/product-bonus-pool-sync';
import { NotificationService } from '../notifications/notification.service';
import type { AcceptedAmountInput } from './reduce-removed-feature-allocations';
import {
  serializeOperationalConfiguration,
  type OperationalConfigurationDto,
} from './serialize-operational-configuration';

const CONFIG_INCLUDE = {
  features: true,
  baseProfileVersion: { include: { roleUnits: true } },
} as const;

@Injectable()
export class DeliveryConfigurationService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    @Optional() private readonly notifications?: NotificationService,
  ) {}

  async getByProduct(productId: string): Promise<OperationalConfigurationDto | { mode: 'LEGACY' }> {
    const row = await this.prisma.deliveryConfiguration.findFirst({
      where: { productId },
      include: CONFIG_INCLUDE,
    });
    if (!row) {
      return { mode: 'LEGACY' };
    }
    return this.toOperational(row);
  }

  async enrollProduct(productId: string, orderId: string): Promise<OperationalConfigurationDto> {
    if (!orderId.trim()) {
      throw new BadRequestException('orderId is required');
    }
    const setting = await this.prisma.deliveryCompensationRuntimeSetting.findUnique({
      where: { id: 'default' },
    });
    if (!setting?.newEnrollmentEnabled) {
      throw new ConflictException('LEGACY_ADOPTION_REQUIRED');
    }
    const existing = await this.prisma.deliveryConfiguration.findFirst({ where: { productId } });
    if (existing) {
      return this.getRequired(existing.id);
    }
    await this.assertOrderBelongsToProduct(productId, orderId);
    await this.assertOrderHasNoBonusEntries(orderId);
    return this.insertProductEnrollment(productId, orderId);
  }

  async addFeature(
    configurationId: string,
    functionId: string,
    expectedRevision?: number,
    actorEmployeeId?: string,
    reason?: string,
  ): Promise<OperationalConfigurationDto> {
    const fn = await this.prisma.deliveryFunction.findUnique({ where: { id: functionId } });
    if (!fn || fn.status !== 'ACTIVE') {
      throw new BadRequestException('FUNCTION_NOT_ACTIVE');
    }
    const written = await this.prisma.$transaction((tx) =>
      applyScopeAddFeature(tx, {
        configurationId,
        functionId,
        expectedRevision,
        actorEmployeeId,
        reason,
      }),
    );
    if (written.createdBonusEntryIds.length > 0) {
      await syncProductBonusPoolForOrder(this.prisma, written.orderId, this.notifications);
    }
    return this.getRequired(configurationId);
  }

  async removeFeature(
    configurationId: string,
    featureId: string,
    input: {
      expectedRevision?: number;
      reason?: string;
      acceptedAmounts?: AcceptedAmountInput[];
      actorEmployeeId?: string;
    },
  ): Promise<OperationalConfigurationDto> {
    const orderId = await this.prisma.$transaction(async (tx) => {
      const row = await tx.deliveryConfiguration.findUnique({
        where: { id: configurationId },
        select: { orderId: true, initialRevisionId: true },
      });
      await applyScopeRemoveFeature(tx, { configurationId, featureId, ...input });
      return row?.initialRevisionId ? row.orderId : null;
    });
    if (orderId) {
      await syncProductBonusPoolForOrder(this.prisma, orderId, this.notifications);
    }
    return this.getRequired(configurationId);
  }

  async replaceEmployee(
    configurationId: string,
    input: {
      roleKey: DeliveryCompensationRoleKey;
      fromEmployeeId: string;
      toEmployeeId: string;
      shares: ReplacementShareInput[];
      reason: string;
      actorEmployeeId: string;
      expectedRevision?: number;
    },
  ): Promise<OperationalConfigurationDto> {
    if (!DELIVERY_COMPENSATION_ROLE_KEYS.includes(input.roleKey)) {
      throw new BadRequestException('roleKey is required');
    }
    const written = await this.prisma.$transaction((tx) =>
      applyEmployeeReplacement(tx, { configurationId, ...input }),
    );
    await syncProductBonusPoolForOrder(this.prisma, written.orderId, this.notifications);
    return this.getRequired(configurationId);
  }

  private async insertProductEnrollment(
    productId: string,
    orderId: string,
  ): Promise<OperationalConfigurationDto> {
    try {
      const created = await this.prisma.deliveryConfiguration.create({
        data: { orderId, productId, entityKind: 'PRODUCT', mode: 'V2' },
        include: CONFIG_INCLUDE,
      });
      return this.toOperational(created);
    } catch (error) {
      if (!isPrismaUniqueConstraint(error)) {
        throw error;
      }
      const existing = await this.prisma.deliveryConfiguration.findFirst({ where: { productId } });
      if (existing) {
        return this.getRequired(existing.id);
      }
      throw new ConflictException('CONFIGURATION_CONFLICT');
    }
  }

  private async assertOrderHasNoBonusEntries(orderId: string): Promise<void> {
    const bonusCount = await this.prisma.bonusEntry.count({ where: { orderId } });
    if (bonusCount > 0) {
      throw new ConflictException('LEGACY_ADOPTION_REQUIRED');
    }
  }

  private async assertOrderBelongsToProduct(productId: string, orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { productId: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.productId !== productId) {
      throw new BadRequestException('ORDER_PRODUCT_MISMATCH');
    }
  }

  private async getRequired(id: string): Promise<OperationalConfigurationDto> {
    const row = await this.prisma.deliveryConfiguration.findUnique({
      where: { id },
      include: CONFIG_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Configuration not found');
    }
    return this.toOperational(row);
  }

  private async toOperational(
    row: Parameters<typeof serializeOperationalConfiguration>[0] &
      Parameters<typeof attachConfigurationReadiness>[1],
  ): Promise<OperationalConfigurationDto> {
    return serializeOperationalConfiguration({
      ...row,
      readiness: await attachConfigurationReadiness(this.prisma, row),
    });
  }
}
