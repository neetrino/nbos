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
import type { ReplacementPlanDto } from './serialize-replacement-plan';
import { loadReplacementPlan } from './load-replacement-plan';
import {
  assertEnrollmentEnabled,
  assertOrderBelongsToExtension,
  assertOrderBelongsToProduct,
  assertOrderHasNoBonusEntries,
} from './enrollment-guards';
import { writeExtensionRoleAssignments } from './write-extension-role-assignments';
import {
  serializeExtensionRoleAssignments,
  type ExtensionRoleAssignmentDto,
  type ExtensionRoleAssignmentInput,
} from './extension-role-assignments';

const CONFIG_INCLUDE = {
  features: true,
  baseProfileVersion: { include: { roleUnits: true } },
  currentRevision: { select: { sequence: true } },
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
    await assertEnrollmentEnabled(this.prisma);
    const existing = await this.prisma.deliveryConfiguration.findFirst({ where: { productId } });
    if (existing) {
      return this.getRequired(existing.id);
    }
    await assertOrderBelongsToProduct(this.prisma, productId, orderId);
    await assertOrderHasNoBonusEntries(this.prisma, orderId);
    return this.insertProductEnrollment(productId, orderId);
  }

  async getByExtension(
    extensionId: string,
  ): Promise<OperationalConfigurationDto | { mode: 'LEGACY' }> {
    const row = await this.prisma.deliveryConfiguration.findFirst({
      where: { extensionId },
      include: CONFIG_INCLUDE,
    });
    if (!row) {
      return { mode: 'LEGACY' };
    }
    return this.toOperational(row);
  }

  /** Enroll an extension under the same readiness switch and legacy guards as a product. */
  async enrollExtension(
    extensionId: string,
    orderId: string,
  ): Promise<OperationalConfigurationDto> {
    if (!orderId.trim()) {
      throw new BadRequestException('orderId is required');
    }
    await assertEnrollmentEnabled(this.prisma);
    const existing = await this.prisma.deliveryConfiguration.findFirst({ where: { extensionId } });
    if (existing) {
      return this.getRequired(existing.id);
    }
    await assertOrderBelongsToExtension(this.prisma, extensionId, orderId);
    await assertOrderHasNoBonusEntries(this.prisma, orderId);
    return this.insertExtensionEnrollment(extensionId, orderId);
  }

  /**
   * Sets who holds each compensated role on an extension. Allowed only before the plan is
   * materialized: after that, moving money between people is a replacement, not an assignment.
   */
  async setExtensionRoleAssignments(
    extensionId: string,
    assignments: ExtensionRoleAssignmentInput[],
  ): Promise<ExtensionRoleAssignmentDto[]> {
    await writeExtensionRoleAssignments(this.prisma, extensionId, assignments);
    return this.listExtensionRoleAssignments(extensionId);
  }

  async listExtensionRoleAssignments(extensionId: string): Promise<ExtensionRoleAssignmentDto[]> {
    const rows = await this.prisma.extensionDeliveryRoleAssignment.findMany({
      where: { extensionId },
      select: {
        roleKey: true,
        employeeId: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    });
    return serializeExtensionRoleAssignments(rows);
  }

  async addFeature(
    configurationId: string,
    functionId: string,
    options: {
      expectedRevision?: number;
      actorEmployeeId?: string;
      reason?: string;
      tierId?: string | null;
    } = {},
  ): Promise<OperationalConfigurationDto> {
    const fn = await this.prisma.deliveryFunction.findUnique({ where: { id: functionId } });
    if (!fn || fn.status !== 'ACTIVE') {
      throw new BadRequestException('FUNCTION_NOT_ACTIVE');
    }
    const written = await this.prisma.$transaction((tx) =>
      applyScopeAddFeature(tx, {
        configurationId,
        functionId,
        tierId: options.tierId,
        expectedRevision: options.expectedRevision,
        actorEmployeeId: options.actorEmployeeId,
        reason: options.reason,
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

  /** Components a replacement must redistribute for one role. Operational only, no money. */
  async getReplacementPlan(
    configurationId: string,
    roleKey: DeliveryCompensationRoleKey,
  ): Promise<ReplacementPlanDto> {
    if (!DELIVERY_COMPENSATION_ROLE_KEYS.includes(roleKey)) {
      throw new BadRequestException('roleKey is required');
    }
    return loadReplacementPlan(this.prisma, configurationId, roleKey);
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

  private async insertExtensionEnrollment(
    extensionId: string,
    orderId: string,
  ): Promise<OperationalConfigurationDto> {
    try {
      const created = await this.prisma.deliveryConfiguration.create({
        data: { orderId, extensionId, entityKind: 'EXTENSION', mode: 'V2' },
        include: CONFIG_INCLUDE,
      });
      return this.toOperational(created);
    } catch (error) {
      if (!isPrismaUniqueConstraint(error)) {
        throw error;
      }
      const existing = await this.prisma.deliveryConfiguration.findFirst({
        where: { extensionId },
      });
      if (existing) {
        return this.getRequired(existing.id);
      }
      throw new ConflictException('CONFIGURATION_CONFLICT');
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
