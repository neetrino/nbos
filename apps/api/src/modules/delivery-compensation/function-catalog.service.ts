import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type {
  CatalogContentPatchInput,
  CatalogContentWriteInput,
  DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import {
  buildCatalogListWhere,
  parseCatalogListQuery,
  whereWithoutCategory,
  type CatalogListQuery,
} from './catalog-list-query';
import { isPrismaUniqueConstraint } from './prisma-unique';
import {
  serializeCardFunction,
  serializeOperationalFunction,
} from './serialize-operational-function';

const CONTENT_INCLUDE = {
  contentVersions: {
    orderBy: { version: 'desc' as const },
    include: {
      attachments: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  tiers: {
    orderBy: { position: 'asc' as const },
    select: { id: true, code: true, label: true, position: true },
  },
} as const;

const CARD_INCLUDE = {
  contentVersions: {
    orderBy: { version: 'desc' as const },
    select: {
      version: true,
      title: true,
      summary: true,
      publishedAt: true,
    },
  },
  tiers: {
    orderBy: { position: 'asc' as const },
    select: { id: true, code: true, label: true, position: true },
  },
} as const;

@Injectable()
export class FunctionCatalogService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listOperational(
    includeNonActive: boolean,
    rawQuery: {
      page?: string;
      pageSize?: string;
      search?: string;
      category?: string;
      status?: string;
    },
  ): Promise<{
    items: DeliveryFunctionOperationalDto[];
    meta: {
      total: number;
      page: number;
      pageSize: number;
      categoryCounts: Record<string, number>;
    };
  }> {
    const query = parseCatalogListQuery(rawQuery);
    const where = buildCatalogListWhere(query, includeNonActive);
    return this.pageOperational(query, where);
  }

  async getOperational(
    id: string,
    includeNonActive: boolean,
  ): Promise<DeliveryFunctionOperationalDto> {
    const row = await this.prisma.deliveryFunction.findUnique({
      where: { id },
      include: CONTENT_INCLUDE,
    });
    if (!row || (!includeNonActive && row.status !== 'ACTIVE')) {
      throw new NotFoundException('Delivery function not found');
    }
    return serializeOperationalFunction(row);
  }

  async createDraft(
    input: CatalogContentWriteInput,
    authorId: string,
  ): Promise<DeliveryFunctionOperationalDto> {
    try {
      const row = await this.prisma.deliveryFunction.create({
        data: {
          code: input.code,
          category: input.category,
          iconKey: input.iconKey,
          status: 'DRAFT',
          authorId,
          contentVersions: {
            create: {
              version: 1,
              title: input.title,
              summary: input.summary,
              scopeBoundaries: input.scopeBoundaries,
              instructions: input.instructions,
              acceptanceCriteria: input.acceptanceCriteria,
              authorId,
            },
          },
        },
        include: CONTENT_INCLUDE,
      });
      return serializeOperationalFunction(row);
    } catch (error) {
      if (isPrismaUniqueConstraint(error)) {
        throw new ConflictException('FUNCTION_CODE_TAKEN');
      }
      throw error;
    }
  }

  async replaceContent(
    id: string,
    input: CatalogContentPatchInput,
    authorId: string,
  ): Promise<DeliveryFunctionOperationalDto> {
    const current = await this.requireFunction(id);
    const nextVersion = (current.contentVersions[0]?.version ?? 0) + 1;
    const row = await this.prisma.deliveryFunction.update({
      where: { id },
      data: {
        category: input.category ?? current.category,
        iconKey: input.iconKey ?? current.iconKey,
        contentVersions: {
          create: {
            version: nextVersion,
            title: input.title,
            summary: input.summary,
            scopeBoundaries: input.scopeBoundaries,
            instructions: input.instructions,
            acceptanceCriteria: input.acceptanceCriteria,
            authorId,
            attachments: {
              create: (current.contentVersions[0]?.attachments ?? []).map((row) => ({
                fileAssetId: row.fileAssetId,
                caption: row.caption,
                sortOrder: row.sortOrder,
              })),
            },
          },
        },
      },
      include: CONTENT_INCLUDE,
    });
    return serializeOperationalFunction(row);
  }

  async activate(id: string): Promise<DeliveryFunctionOperationalDto> {
    const current = await this.requireFunction(id);
    const latest = current.contentVersions[0];
    if (!latest) {
      throw new ConflictException('CONTENT_REQUIRED');
    }
    const row = await this.prisma.deliveryFunction.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        contentVersions: latest.publishedAt
          ? undefined
          : { update: { where: { id: latest.id }, data: { publishedAt: new Date() } } },
      },
      include: CONTENT_INCLUDE,
    });
    return serializeOperationalFunction(row);
  }

  async archive(id: string): Promise<DeliveryFunctionOperationalDto> {
    const current = await this.requireFunction(id);
    if (current.status === 'ARCHIVED') {
      return serializeOperationalFunction(current);
    }
    const row = await this.prisma.deliveryFunction.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: CONTENT_INCLUDE,
    });
    return serializeOperationalFunction(row);
  }

  private async pageOperational(query: CatalogListQuery, where: Record<string, unknown>) {
    const countsWhere = whereWithoutCategory(where);
    const [total, rows, categoryRows] = await Promise.all([
      this.prisma.deliveryFunction.count({ where }),
      this.prisma.deliveryFunction.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: query.skip,
        take: query.pageSize,
        include: CARD_INCLUDE,
      }),
      this.prisma.deliveryFunction.groupBy({
        by: ['category'],
        where: countsWhere,
        _count: { _all: true },
      }),
    ]);
    return {
      items: rows.map(serializeCardFunction),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        categoryCounts: Object.fromEntries(
          categoryRows.map((row) => [row.category, row._count._all]),
        ),
      },
    };
  }

  private async requireFunction(id: string) {
    const row = await this.prisma.deliveryFunction.findUnique({
      where: { id },
      include: CONTENT_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Delivery function not found');
    }
    return row;
  }
}
