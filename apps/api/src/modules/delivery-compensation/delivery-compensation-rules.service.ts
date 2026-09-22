import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type TransactionClient } from '@nbos/database';
import {
  CatalogContentValidationError,
  functionPriceTierTargetError,
  type BaseProfileWriteInput,
  type DeliveryBaseProfileFinancialDto,
  type DeliveryFunctionPriceFinancialDto,
  type DeliveryRoleRateFinancialDto,
  type DeliveryRoleUnitInput,
  type FunctionPriceWriteInput,
  type RoleRateWriteInput,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import {
  serializeBaseProfile,
  serializeFunctionPrice,
  serializeRoleRate,
} from './serialize-norm-version';

export const DELIVERY_RUNTIME_SETTING_ID = 'default';

export type DeliveryEnrollmentSettingDto = {
  newEnrollmentEnabled: boolean;
  updatedAt: string | null;
};

@Injectable()
export class DeliveryCompensationRulesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /** Readiness switch that decides whether new deliveries may enroll in V2 at all. */
  async getEnrollmentSetting(): Promise<DeliveryEnrollmentSettingDto> {
    const setting = await this.prisma.deliveryCompensationRuntimeSetting.findUnique({
      where: { id: DELIVERY_RUNTIME_SETTING_ID },
    });
    return {
      newEnrollmentEnabled: setting?.newEnrollmentEnabled ?? false,
      updatedAt: setting?.updatedAt?.toISOString() ?? null,
    };
  }

  async setEnrollmentSetting(enabled: boolean): Promise<DeliveryEnrollmentSettingDto> {
    const setting = await this.prisma.deliveryCompensationRuntimeSetting.upsert({
      where: { id: DELIVERY_RUNTIME_SETTING_ID },
      create: { id: DELIVERY_RUNTIME_SETTING_ID, newEnrollmentEnabled: enabled },
      update: { newEnrollmentEnabled: enabled },
    });
    return {
      newEnrollmentEnabled: setting.newEnrollmentEnabled,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  async listFunctionPrices(): Promise<DeliveryFunctionPriceFinancialDto[]> {
    const rows = await this.prisma.deliveryFunctionPriceVersion.findMany({
      orderBy: [{ functionId: 'asc' }, { version: 'desc' }],
      include: { roleUnits: { orderBy: { roleKey: 'asc' } } },
    });
    return rows.map(serializeFunctionPrice);
  }

  async listBaseProfiles(): Promise<DeliveryBaseProfileFinancialDto[]> {
    const rows = await this.prisma.deliveryBaseProfileVersion.findMany({
      orderBy: [{ profileKey: 'asc' }, { version: 'desc' }],
      include: {
        roleUnits: { orderBy: { roleKey: 'asc' } },
        includedFunctions: { select: { functionId: true } },
      },
    });
    return rows.map(serializeBaseProfile);
  }

  async listRoleRates(): Promise<DeliveryRoleRateFinancialDto[]> {
    const rows = await this.prisma.deliveryRoleRateVersion.findMany({
      orderBy: [{ roleKey: 'asc' }, { version: 'desc' }],
    });
    return rows.map(serializeRoleRate);
  }

  async createRoleRateDraft(input: RoleRateWriteInput): Promise<DeliveryRoleRateFinancialDto> {
    const row = await this.prisma.$transaction((tx) => this.writeOpenRoleRateDraft(tx, input), {
      isolationLevel: 'Serializable',
    });
    return serializeRoleRate(row);
  }

  async updateRoleRateDraft(
    id: string,
    input: { rate: string },
  ): Promise<DeliveryRoleRateFinancialDto> {
    const draft = await this.requireDraftRoleRate(id);
    const row = await this.prisma.deliveryRoleRateVersion.update({
      where: { id: draft.id },
      data: { rate: input.rate },
    });
    return serializeRoleRate(row);
  }

  /** Draft unit vector for one catalog function. Publishing stays a separate Owner action. */
  async createFunctionPriceDraft(
    input: FunctionPriceWriteInput,
  ): Promise<DeliveryFunctionPriceFinancialDto> {
    const target = await this.prisma.deliveryFunction.findUnique({
      where: { id: input.functionId },
      select: { id: true, tiers: { select: { id: true } } },
    });
    if (!target) {
      throw new NotFoundException('Function not found');
    }
    const tierError = functionPriceTierTargetError(
      target.tiers.map((tier) => tier.id),
      input.tierId,
    );
    if (tierError) {
      throw new CatalogContentValidationError(tierError);
    }
    const row = await this.prisma.$transaction(
      (tx) => this.writeOpenFunctionPriceDraft(tx, input),
      { isolationLevel: 'Serializable' },
    );
    return serializeFunctionPrice(row);
  }

  async updateFunctionPriceDraft(
    id: string,
    input: { roleUnits: DeliveryRoleUnitInput[] },
  ): Promise<DeliveryFunctionPriceFinancialDto> {
    const draft = await this.requireDraftFunctionPrice(id);
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.deliveryFunctionPriceRoleUnit.deleteMany({ where: { priceVersionId: draft.id } });
      return tx.deliveryFunctionPriceVersion.update({
        where: { id: draft.id },
        data: { roleUnits: { create: input.roleUnits } },
        include: { roleUnits: { orderBy: { roleKey: 'asc' } } },
      });
    });
    return serializeFunctionPrice(row);
  }

  /** Draft base profile (product or extension core) with its own per-role unit vector. */
  async createBaseProfileDraft(
    input: BaseProfileWriteInput,
  ): Promise<DeliveryBaseProfileFinancialDto> {
    await this.assertIncludedFunctionsExist(input.includedFunctionIds);
    const latest = await this.prisma.deliveryBaseProfileVersion.findFirst({
      where: { profileKey: input.profileKey },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const row = await this.prisma.deliveryBaseProfileVersion.create({
      data: {
        profileKey: input.profileKey,
        version: (latest?.version ?? 0) + 1,
        entityKind: input.entityKind,
        productType: input.productType,
        productCategory: input.productCategory,
        implementationBase: input.implementationBase,
        designMode: input.designMode,
        aiDesignerReview: input.aiDesignerReview,
        description: input.description,
        status: 'DRAFT',
        effectiveFrom: new Date(input.effectiveFrom),
        roleUnits: { create: input.roleUnits },
        includedFunctions: {
          create: input.includedFunctionIds.map((functionId) => ({ functionId })),
        },
      },
      include: {
        roleUnits: { orderBy: { roleKey: 'asc' } },
        includedFunctions: { select: { functionId: true } },
      },
    });
    return serializeBaseProfile(row);
  }

  private async writeOpenRoleRateDraft(tx: TransactionClient, input: RoleRateWriteInput) {
    const open = await tx.deliveryRoleRateVersion.findFirst({
      where: { roleKey: input.roleKey, status: 'DRAFT' },
      select: { id: true },
    });
    if (open) {
      return tx.deliveryRoleRateVersion.update({
        where: { id: open.id },
        data: { rate: input.rate },
      });
    }
    const latest = await tx.deliveryRoleRateVersion.findFirst({
      where: { roleKey: input.roleKey },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return tx.deliveryRoleRateVersion.create({
      data: {
        roleKey: input.roleKey,
        currency: input.currency,
        rate: input.rate,
        version: (latest?.version ?? 0) + 1,
        status: 'DRAFT',
        effectiveFrom: new Date(input.effectiveFrom),
      },
    });
  }

  private async writeOpenFunctionPriceDraft(tx: TransactionClient, input: FunctionPriceWriteInput) {
    const open = await tx.deliveryFunctionPriceVersion.findFirst({
      where: { functionId: input.functionId, tierId: input.tierId, status: 'DRAFT' },
      select: { id: true },
    });
    if (open) {
      await tx.deliveryFunctionPriceRoleUnit.deleteMany({ where: { priceVersionId: open.id } });
      return tx.deliveryFunctionPriceVersion.update({
        where: { id: open.id },
        data: { roleUnits: { create: input.roleUnits } },
        include: { roleUnits: { orderBy: { roleKey: 'asc' } } },
      });
    }
    const latest = await tx.deliveryFunctionPriceVersion.findFirst({
      where: { functionId: input.functionId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return tx.deliveryFunctionPriceVersion.create({
      data: {
        functionId: input.functionId,
        tierId: input.tierId,
        version: (latest?.version ?? 0) + 1,
        status: 'DRAFT',
        effectiveFrom: new Date(input.effectiveFrom),
        roleUnits: { create: input.roleUnits },
      },
      include: { roleUnits: { orderBy: { roleKey: 'asc' } } },
    });
  }

  private async requireDraftRoleRate(id: string) {
    const row = await this.prisma.deliveryRoleRateVersion.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Role rate not found');
    }
    if (row.status !== 'DRAFT') {
      throw new BadRequestException('Only a draft role rate can be updated.');
    }
    return row;
  }

  private async requireDraftFunctionPrice(id: string) {
    const row = await this.prisma.deliveryFunctionPriceVersion.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Function price not found');
    }
    if (row.status !== 'DRAFT') {
      throw new BadRequestException('Only a draft function price can be updated.');
    }
    return row;
  }

  private async assertIncludedFunctionsExist(functionIds: readonly string[]): Promise<void> {
    if (functionIds.length === 0) {
      return;
    }
    const found = await this.prisma.deliveryFunction.count({
      where: { id: { in: [...functionIds] } },
    });
    if (found !== functionIds.length) {
      throw new CatalogContentValidationError('includedFunctionIds contains unknown functions');
    }
  }
}
