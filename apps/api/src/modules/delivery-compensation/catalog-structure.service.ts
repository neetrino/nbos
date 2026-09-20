import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  parseCoreItemsBody,
  parseSizePresetBody,
  type CoreItemInput,
  type DeliveryConfigSize,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';

export type CoreItemDto = { id: string; position: number; label: string; note: string | null };

export type SizePresetDto = {
  profileKey: string;
  configSize: string;
  functionIds: string[];
};

/**
 * Composition of a product core and the module sets pre-checked per size. Neither carries money:
 * a core item describes work the base units already pay for, and a preset only pre-selects modules
 * that are still charged as normal extras.
 */
@Injectable()
export class CatalogStructureService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listCoreItems(profileVersionId: string): Promise<CoreItemDto[]> {
    await this.requireProfileVersion(profileVersionId);
    const rows = await this.prisma.deliveryBaseProfileCoreItem.findMany({
      where: { profileVersionId },
      orderBy: { position: 'asc' },
      select: { id: true, position: true, label: true, note: true },
    });
    return rows;
  }

  /**
   * Replaces the composition of a draft core. A published version is history the client may already
   * have been shown, so it is superseded by publishing a new version rather than edited in place.
   */
  async replaceCoreItems(profileVersionId: string, body: unknown): Promise<CoreItemDto[]> {
    const version = await this.requireProfileVersion(profileVersionId);
    if (version.status !== 'DRAFT') {
      throw new BadRequestException('Only a draft base profile version can be edited.');
    }
    const items = parseCoreItemsBody(body);
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryBaseProfileCoreItem.deleteMany({ where: { profileVersionId } });
      await tx.deliveryBaseProfileCoreItem.createMany({
        data: items.map((item, index) => coreItemRow(profileVersionId, item, index)),
      });
    });
    return this.listCoreItems(profileVersionId);
  }

  async listSizePresets(profileKey: string): Promise<SizePresetDto[]> {
    const rows = await this.prisma.deliveryConfigSizePreset.findMany({
      where: { profileKey },
      orderBy: [{ configSize: 'asc' }, { createdAt: 'asc' }],
      select: { configSize: true, functionId: true },
    });
    const bySize = new Map<string, string[]>();
    for (const row of rows) {
      const list = bySize.get(row.configSize) ?? [];
      list.push(row.functionId);
      bySize.set(row.configSize, list);
    }
    return [...bySize.entries()].map(([configSize, functionIds]) => ({
      profileKey,
      configSize,
      functionIds,
    }));
  }

  /** Replaces one size level of one profile. An empty list clears that level. */
  async replaceSizePreset(body: unknown): Promise<SizePresetDto> {
    const input = parseSizePresetBody(body);
    await this.assertFunctionsExist(input.functionIds);
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryConfigSizePreset.deleteMany({
        where: { profileKey: input.profileKey, configSize: input.configSize },
      });
      await tx.deliveryConfigSizePreset.createMany({
        data: input.functionIds.map((functionId) => ({
          profileKey: input.profileKey,
          configSize: input.configSize,
          functionId,
        })),
      });
    });
    return {
      profileKey: input.profileKey,
      configSize: input.configSize,
      functionIds: input.functionIds,
    };
  }

  /** Modules a constructor should pre-check for this profile and size. */
  async presetFunctionIds(profileKey: string, configSize: DeliveryConfigSize): Promise<string[]> {
    const rows = await this.prisma.deliveryConfigSizePreset.findMany({
      where: { profileKey, configSize },
      select: { functionId: true },
    });
    return rows.map((row) => row.functionId);
  }

  private async requireProfileVersion(id: string): Promise<{ id: string; status: string }> {
    const version = await this.prisma.deliveryBaseProfileVersion.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!version) {
      throw new NotFoundException(`Base profile version ${id} not found`);
    }
    return version;
  }

  private async assertFunctionsExist(functionIds: readonly string[]): Promise<void> {
    if (functionIds.length === 0) return;
    const found = await this.prisma.deliveryFunction.count({
      where: { id: { in: [...functionIds] } },
    });
    if (found !== functionIds.length) {
      throw new BadRequestException('A preset references a function that does not exist.');
    }
  }
}

function coreItemRow(profileVersionId: string, item: CoreItemInput, index: number) {
  return {
    profileVersionId,
    position: index + 1,
    label: item.label,
    note: item.note,
  };
}
