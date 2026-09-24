import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type ProductTypeEnum } from '@nbos/database';
import { parseCollectionBody } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';

export type FunctionCollectionDto = {
  id: string;
  productType: string;
  name: string;
  position: number;
  functionIds: string[];
};

/**
 * Named extra-function kits. A click replaces the deal quote selection. Kits are not money and
 * never mark a function included-in-base.
 */
@Injectable()
export class FunctionCollectionsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async list(productType?: string): Promise<FunctionCollectionDto[]> {
    const rows = await this.prisma.deliveryFunctionCollection.findMany({
      where: productType ? { productType: productType as ProductTypeEnum } : undefined,
      orderBy: [{ productType: 'asc' }, { position: 'asc' }],
      include: { items: { orderBy: { position: 'asc' }, select: { functionId: true } } },
    });
    return rows.map(toDto);
  }

  async create(body: unknown): Promise<FunctionCollectionDto> {
    const input = parseCollectionBody(body);
    await this.assertFunctionsExist(input.functionIds);
    const position = await this.nextPosition(input.productType);
    const row = await this.prisma.deliveryFunctionCollection.create({
      data: {
        productType: input.productType,
        name: input.name,
        position,
        items: {
          create: input.functionIds.map((functionId, index) => ({
            functionId,
            position: index + 1,
          })),
        },
      },
      include: { items: { orderBy: { position: 'asc' }, select: { functionId: true } } },
    });
    return toDto(row);
  }

  async replace(id: string, body: unknown): Promise<FunctionCollectionDto> {
    const input = parseCollectionBody(body);
    await this.requireCollection(id);
    await this.assertFunctionsExist(input.functionIds);
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.deliveryFunctionCollectionItem.deleteMany({ where: { collectionId: id } });
      return tx.deliveryFunctionCollection.update({
        where: { id },
        data: {
          productType: input.productType,
          name: input.name,
          items: {
            create: input.functionIds.map((functionId, index) => ({
              functionId,
              position: index + 1,
            })),
          },
        },
        include: { items: { orderBy: { position: 'asc' }, select: { functionId: true } } },
      });
    });
    return toDto(row);
  }

  async remove(id: string): Promise<void> {
    await this.requireCollection(id);
    await this.prisma.deliveryFunctionCollection.delete({ where: { id } });
  }

  private async requireCollection(id: string): Promise<void> {
    const found = await this.prisma.deliveryFunctionCollection.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
  }

  private async nextPosition(productType: ProductTypeEnum): Promise<number> {
    const last = await this.prisma.deliveryFunctionCollection.findFirst({
      where: { productType },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? 0) + 1;
  }

  private async assertFunctionsExist(functionIds: readonly string[]): Promise<void> {
    if (functionIds.length === 0) return;
    const found = await this.prisma.deliveryFunction.count({
      where: { id: { in: [...functionIds] } },
    });
    if (found !== functionIds.length) {
      throw new BadRequestException('A collection references a function that does not exist.');
    }
  }
}

function toDto(row: {
  id: string;
  productType: string;
  name: string;
  position: number;
  items: Array<{ functionId: string }>;
}): FunctionCollectionDto {
  return {
    id: row.id,
    productType: row.productType,
    name: row.name,
    position: row.position,
    functionIds: row.items.map((item) => item.functionId),
  };
}
