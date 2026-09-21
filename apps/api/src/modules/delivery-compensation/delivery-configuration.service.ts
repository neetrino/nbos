import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { applyEmployeeReplacement } from './apply-employee-replacement';
import { applyConfigurationParameters } from './apply-configuration-parameters';
import { applyScopeAddFeature } from './apply-scope-add-feature';
import { applyScopeRemoveFeature } from './apply-scope-remove-feature';
import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  parseConfigurationParametersBody,
  type DeliveryCompensationRoleKey,
} from '@nbos/shared';
import type { ReplacementShareInput } from './apply-employee-replacement';
import { attachConfigurationReadiness } from './attach-configuration-readiness';
import {
  assertConfigurationAccessible,
  assertExtensionConfigurable,
  assertProductConfigurable,
  type DeliveryConfigurationAccess,
} from './delivery-configuration-access';
import { insertDeliveryEnrollment } from './insert-delivery-enrollment';
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
  assertExtensionNeverClosed,
  assertOrderBelongsToExtension,
  assertOrderBelongsToProduct,
  assertOrderHasNoBonusEntries,
  assertProductNeverClosed,
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

  async getByProduct(
    productId: string,
    access: DeliveryConfigurationAccess,
  ): Promise<OperationalConfigurationDto | { mode: 'LEGACY' }> {
    await assertProductConfigurable(this.prisma, productId, access);
    const row = await this.prisma.deliveryConfiguration.findFirst({
      where: { productId },
      include: CONFIG_INCLUDE,
    });
    if (!row) {
      return { mode: 'LEGACY' };
    }
    return this.toOperational(row);
  }

  async enrollProduct(
    productId: string,
    orderId: string,
    access: DeliveryConfigurationAccess,
  ): Promise<OperationalConfigurationDto> {
    if (!orderId.trim()) {
      throw new BadRequestException('orderId is required');
    }
    await assertProductConfigurable(this.prisma, productId, access);
    await assertEnrollmentEnabled(this.prisma);
    const existing = await this.prisma.deliveryConfiguration.findFirst({ where: { productId } });
    if (existing) {
      return this.getRequired(existing.id);
    }
    await assertProductNeverClosed(this.prisma, productId);
    await assertOrderBelongsToProduct(this.prisma, productId, orderId);
    await assertOrderHasNoBonusEntries(this.prisma, orderId);
    return this.getRequired(await insertDeliveryEnrollment(this.prisma, { productId }, orderId));
  }

  async getByExtension(
    extensionId: string,
    access: DeliveryConfigurationAccess,
  ): Promise<OperationalConfigurationDto | { mode: 'LEGACY' }> {
    await assertExtensionConfigurable(this.prisma, extensionId, access);
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
    access: DeliveryConfigurationAccess,
  ): Promise<OperationalConfigurationDto> {
    if (!orderId.trim()) {
      throw new BadRequestException('orderId is required');
    }
    await assertExtensionConfigurable(this.prisma, extensionId, access);
    await assertEnrollmentEnabled(this.prisma);
    const existing = await this.prisma.deliveryConfiguration.findFirst({ where: { extensionId } });
    if (existing) {
      return this.getRequired(existing.id);
    }
    await assertExtensionNeverClosed(this.prisma, extensionId);
    await assertOrderBelongsToExtension(this.prisma, extensionId, orderId);
    await assertOrderHasNoBonusEntries(this.prisma, orderId);
    return this.getRequired(await insertDeliveryEnrollment(this.prisma, { extensionId }, orderId));
  }

  /**
   * Sets who holds each compensated role on an extension. Allowed only before the plan is
   * materialized: after that, moving money between people is a replacement, not an assignment.
   */
  async setExtensionRoleAssignments(
    extensionId: string,
    assignments: ExtensionRoleAssignmentInput[],
    access: DeliveryConfigurationAccess,
  ): Promise<ExtensionRoleAssignmentDto[]> {
    await assertExtensionConfigurable(this.prisma, extensionId, access);
    await writeExtensionRoleAssignments(this.prisma, extensionId, assignments);
    return this.listExtensionRoleAssignments(extensionId, access);
  }

  async listExtensionRoleAssignments(
    extensionId: string,
    access: DeliveryConfigurationAccess,
  ): Promise<ExtensionRoleAssignmentDto[]> {
    await assertExtensionConfigurable(this.prisma, extensionId, access);
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
    access: DeliveryConfigurationAccess,
    options: {
      expectedRevision?: number;
      actorEmployeeId?: string;
      reason?: string;
      tierId?: string | null;
    } = {},
  ): Promise<OperationalConfigurationDto> {
    await assertConfigurationAccessible(this.prisma, configurationId, access);
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

  /** Confirms the parameters of a card and freezes the published base profile that prices its core. */
  async setParameters(
    configurationId: string,
    body: unknown,
    access: DeliveryConfigurationAccess,
    actorEmployeeId?: string,
  ): Promise<OperationalConfigurationDto> {
    await assertConfigurationAccessible(this.prisma, configurationId, access);
    const parameters = parseConfigurationParametersBody(body);
    await this.prisma.$transaction((tx) =>
      applyConfigurationParameters(tx, { configurationId, parameters, actorEmployeeId }),
    );
    return this.getRequired(configurationId);
  }

  async removeFeature(
    configurationId: string,
    featureId: string,
    access: DeliveryConfigurationAccess,
    input: {
      expectedRevision?: number;
      reason?: string;
      acceptedAmounts?: AcceptedAmountInput[];
      actorEmployeeId?: string;
    },
  ): Promise<OperationalConfigurationDto> {
    await assertConfigurationAccessible(this.prisma, configurationId, access);
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
    access: DeliveryConfigurationAccess,
  ): Promise<ReplacementPlanDto> {
    if (!DELIVERY_COMPENSATION_ROLE_KEYS.includes(roleKey)) {
      throw new BadRequestException('roleKey is required');
    }
    await assertConfigurationAccessible(this.prisma, configurationId, access);
    return loadReplacementPlan(this.prisma, configurationId, roleKey);
  }

  async replaceEmployee(
    configurationId: string,
    access: DeliveryConfigurationAccess,
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
    await assertConfigurationAccessible(this.prisma, configurationId, access);
    const written = await this.prisma.$transaction((tx) =>
      applyEmployeeReplacement(tx, { configurationId, ...input }),
    );
    await syncProductBonusPoolForOrder(this.prisma, written.orderId, this.notifications);
    return this.getRequired(configurationId);
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
