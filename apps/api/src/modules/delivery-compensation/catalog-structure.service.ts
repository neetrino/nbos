import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { parseCoreItemsBody, type CoreItemInput } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';

export type CoreItemDto = { id: string; position: number; label: string; note: string | null };

/**
 * Composition of a product core. A core item describes work the base units already pay for.
 */
@Injectable()
export class CatalogStructureService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listCoreItems(profileVersionId: string): Promise<CoreItemDto[]> {
    await this.requireProfileVersion(profileVersionId);
    return this.prisma.deliveryBaseProfileCoreItem.findMany({
      where: { profileVersionId },
      orderBy: { position: 'asc' },
      select: { id: true, position: true, label: true, note: true },
    });
  }

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
}

function coreItemRow(profileVersionId: string, item: CoreItemInput, index: number) {
  return {
    profileVersionId,
    position: index + 1,
    label: item.label,
    note: item.note,
  };
}
