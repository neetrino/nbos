import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type TransactionClient } from '@nbos/database';
import { parseCoreItemsBody, type CoreItemInput } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { resolveCoreItemsVersionId } from './revise-core-composition';

export type CoreItemDto = { id: string; position: number; label: string; note: string | null };

export type CoreItemsSaveResult = { profileVersionId: string; items: CoreItemDto[] };

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

  async replaceCoreItems(profileVersionId: string, body: unknown): Promise<CoreItemsSaveResult> {
    const items = parseCoreItemsBody(body);
    return this.prisma.$transaction(
      async (tx) => {
        const targetId = await resolveCoreItemsVersionId(tx, profileVersionId);
        await writeCoreItems(tx, targetId, items);
        return { profileVersionId: targetId, items: await readCoreItems(tx, targetId) };
      },
      { isolationLevel: 'Serializable' },
    );
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

async function writeCoreItems(
  tx: TransactionClient,
  profileVersionId: string,
  items: CoreItemInput[],
): Promise<void> {
  await tx.deliveryBaseProfileCoreItem.deleteMany({ where: { profileVersionId } });
  if (items.length === 0) return;
  await tx.deliveryBaseProfileCoreItem.createMany({
    data: items.map((item, index) => coreItemRow(profileVersionId, item, index)),
  });
}

function readCoreItems(tx: TransactionClient, profileVersionId: string): Promise<CoreItemDto[]> {
  return tx.deliveryBaseProfileCoreItem.findMany({
    where: { profileVersionId },
    orderBy: { position: 'asc' },
    select: { id: true, position: true, label: true, note: true },
  });
}

function coreItemRow(profileVersionId: string, item: CoreItemInput, index: number) {
  return {
    profileVersionId,
    position: index + 1,
    label: item.label,
    note: item.note,
  };
}
