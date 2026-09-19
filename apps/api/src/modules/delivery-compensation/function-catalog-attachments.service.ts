import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { PRISMA_TOKEN } from '../../database.module';
import { assertCatalogAttachmentAllowed } from './catalog-attachment-acl';
import { driveAccessFromUser } from './drive-access-from-user';
import { serializeOperationalFunction } from './serialize-operational-function';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';

const CONTENT_INCLUDE = {
  contentVersions: {
    orderBy: { version: 'desc' as const },
    include: {
      attachments: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
} as const;

export type CatalogAttachmentWriteBody = {
  fileAssetId?: string;
  caption?: string | null;
  sortOrder?: number;
  units?: unknown;
  rate?: unknown;
};

@Injectable()
export class FunctionCatalogAttachmentsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async attach(
    functionId: string,
    body: CatalogAttachmentWriteBody,
    user: CurrentUserPayload,
  ): Promise<DeliveryFunctionOperationalDto> {
    if (!body.fileAssetId?.trim()) {
      throw new BadRequestException('fileAssetId is required');
    }
    if ('units' in body || 'rate' in body) {
      throw new BadRequestException('Financial fields are not accepted on catalog attachments');
    }
    await assertCatalogAttachmentAllowed(
      this.prisma,
      body.fileAssetId.trim(),
      driveAccessFromUser(user),
    );

    const fn = await this.prisma.deliveryFunction.findUnique({
      where: { id: functionId },
      include: CONTENT_INCLUDE,
    });
    if (!fn) {
      throw new NotFoundException('Delivery function not found');
    }
    const latest = fn.contentVersions[0];
    if (!latest) {
      throw new BadRequestException('CONTENT_REQUIRED');
    }

    const targetVersionId = latest.publishedAt
      ? (
          await this.prisma.deliveryFunctionContentVersion.create({
            data: {
              functionId,
              version: latest.version + 1,
              title: latest.title,
              summary: latest.summary,
              scopeBoundaries: latest.scopeBoundaries,
              instructions: latest.instructions,
              acceptanceCriteria: latest.acceptanceCriteria,
              authorId: user.id,
              attachments: {
                create: latest.attachments.map((row) => ({
                  fileAssetId: row.fileAssetId,
                  caption: row.caption,
                  sortOrder: row.sortOrder,
                })),
              },
            },
          })
        ).id
      : latest.id;

    await this.prisma.deliveryFunctionAttachment.create({
      data: {
        contentVersionId: targetVersionId,
        fileAssetId: body.fileAssetId.trim(),
        caption: body.caption?.trim() || null,
        sortOrder: body.sortOrder ?? latest.attachments.length,
      },
    });

    const row = await this.prisma.deliveryFunction.findUniqueOrThrow({
      where: { id: functionId },
      include: CONTENT_INCLUDE,
    });
    return serializeOperationalFunction(row);
  }
}
