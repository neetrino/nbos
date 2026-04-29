import { randomUUID } from 'node:crypto';
import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  PrismaClient,
  type DocumentAttachmentPurposeEnum,
  type DocumentStatusEnum,
  type DocumentTypeEnum,
  type InputJsonValue,
  type Prisma,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { DEFAULT_DOCUMENT_SECTIONS } from './documents-default-sections';
import { DOCUMENT_LIST_INCLUDE, DOCUMENT_DETAIL_INCLUDE } from './documents-includes';
import { DOCUMENT_LIST_LIMIT } from './documents.constants';
import { slugifyTitle } from './documents-slug';
import type {
  AddDocumentAttachmentDto,
  CreateDocumentDto,
  CreateDocumentTagDto,
  ListDocumentsQuery,
  UpdateDocumentDto,
} from './documents.types';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listSections() {
    await this.ensureDefaultSections();
    return this.prisma.documentSection.findMany({
      where: { archivedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async listTags() {
    return this.prisma.documentTag.findMany({ orderBy: { name: 'asc' } });
  }

  async createTag(dto: CreateDocumentTagDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Tag name is required.');
    const slug = `${slugifyTitle(name)}-${randomUUID().slice(0, 8)}`;
    return this.prisma.documentTag.create({
      data: { name, slug, color: dto.color?.trim() },
    });
  }

  async listDocuments(query: ListDocumentsQuery) {
    await this.ensureDefaultSections();
    const where: Prisma.DocumentWhereInput = {};
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.status) where.status = query.status as DocumentStatusEnum;
    else if (!query.includeArchived) where.status = { not: 'ARCHIVED' };
    if (query.search?.trim()) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }
    return this.prisma.document.findMany({
      where,
      include: DOCUMENT_LIST_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: DOCUMENT_LIST_LIMIT,
    });
  }

  async getDocument(id: string) {
    await this.ensureDefaultSections();
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: DOCUMENT_DETAIL_INCLUDE,
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async createDocument(dto: CreateDocumentDto, actorId: string) {
    await this.ensureDefaultSections();
    const title = dto.title?.trim();
    if (!title) throw new BadRequestException('Title is required.');
    const section = await this.prisma.documentSection.findFirst({
      where: { id: dto.sectionId, archivedAt: null },
    });
    if (!section) throw new NotFoundException(`Section ${dto.sectionId} not found`);

    const type = (dto.type as DocumentTypeEnum | undefined) ?? 'NATIVE';
    const slug = `${slugifyTitle(title)}-${randomUUID().slice(0, 8)}`;

    const doc = await this.prisma.document.create({
      data: {
        title,
        slug,
        description: dto.description?.trim(),
        sectionId: dto.sectionId,
        type,
        createdById: actorId,
        updatedById: actorId,
        ownerId: actorId,
      },
    });
    await this.recordActivity(doc.id, actorId, 'created', { title });
    return this.getDocument(doc.id);
  }

  async updateDocument(id: string, dto: UpdateDocumentDto, actorId: string) {
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Document ${id} not found`);

    if (dto.sectionId) {
      const section = await this.prisma.documentSection.findFirst({
        where: { id: dto.sectionId, archivedAt: null },
      });
      if (!section) throw new NotFoundException(`Section ${dto.sectionId} not found`);
    }

    const data: Prisma.DocumentUpdateInput = { updatedById: actorId };
    if (dto.title !== undefined) {
      const nextTitle = dto.title.trim();
      if (!nextTitle) throw new BadRequestException('Title cannot be empty.');
      data.title = nextTitle;
    }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.sectionId !== undefined) data.section = { connect: { id: dto.sectionId } };
    if (dto.contentJson !== undefined) data.contentJson = dto.contentJson as InputJsonValue;
    if (dto.contentHtml !== undefined) data.contentHtml = dto.contentHtml;
    if (dto.plainText !== undefined) data.plainText = dto.plainText;

    if (dto.status !== undefined) {
      const next = dto.status as DocumentStatusEnum;
      if (next === 'PUBLISHED' && existing.status === 'DRAFT') {
        data.status = 'PUBLISHED';
        data.publishedAt = new Date();
        data.publishedById = actorId;
      } else if (next === 'DRAFT' && existing.status === 'PUBLISHED') {
        throw new BadRequestException('Cannot unpublish a document via update; archive instead.');
      } else if (next !== existing.status) {
        data.status = next;
      }
    }

    await this.prisma.document.update({ where: { id }, data });
    const shouldSkipUpdateActivity = this.shouldSkipUpdateActivityAfterPatch(existing, dto);
    if (!shouldSkipUpdateActivity) {
      const action =
        dto.status === 'PUBLISHED' && existing.status === 'DRAFT' ? 'published' : 'updated';
      await this.recordActivity(id, actorId, action, {});
    }
    return this.getDocument(id);
  }

  private shouldSkipUpdateActivityAfterPatch(
    existing: { status: DocumentStatusEnum },
    dto: UpdateDocumentDto,
  ): boolean {
    const publishing = dto.status === 'PUBLISHED' && existing.status === 'DRAFT';
    if (publishing) return false;
    if (dto.recordActivity !== false) return false;
    return this.isContentFieldsOnlyPatch(dto);
  }

  private isContentFieldsOnlyPatch(dto: UpdateDocumentDto): boolean {
    const touchesContent =
      dto.contentJson !== undefined || dto.contentHtml !== undefined || dto.plainText !== undefined;
    if (!touchesContent) return false;
    return (
      dto.title === undefined &&
      dto.description === undefined &&
      dto.sectionId === undefined &&
      dto.status === undefined
    );
  }

  async archiveDocument(id: string, actorId: string) {
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Document ${id} not found`);
    await this.prisma.document.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedById: actorId,
      },
    });
    await this.recordActivity(id, actorId, 'archived', {});
    return this.getDocument(id);
  }

  async addDocumentAttachment(documentId: string, dto: AddDocumentAttachmentDto, actorId: string) {
    await this.ensureDefaultSections();
    const fileAssetId = dto.fileAssetId?.trim();
    if (!fileAssetId) throw new BadRequestException('fileAssetId is required.');
    await this.assertDocumentModifiable(documentId);
    await this.assertFileLinkedToDocument(fileAssetId, documentId);
    const purpose = (dto.purpose ?? 'ATTACHMENT') as DocumentAttachmentPurposeEnum;
    await this.assertPurposeMatchesMime(purpose, fileAssetId);
    const duplicate = await this.prisma.documentAttachment.findFirst({
      where: { documentId, fileAssetId },
    });
    if (duplicate) throw new BadRequestException('This file is already attached.');
    await this.prisma.documentAttachment.create({
      data: {
        documentId,
        fileAssetId,
        purpose,
        sortOrder: dto.sortOrder ?? 0,
        createdById: actorId,
      },
    });
    await this.prisma.document.update({
      where: { id: documentId },
      data: { updatedById: actorId },
    });
    await this.recordActivity(documentId, actorId, 'attachment_added', { fileAssetId });
    return this.getDocument(documentId);
  }

  async removeDocumentAttachment(documentId: string, attachmentId: string, actorId: string) {
    await this.ensureDefaultSections();
    await this.assertDocumentModifiable(documentId);
    const row = await this.prisma.documentAttachment.findFirst({
      where: { id: attachmentId, documentId },
    });
    if (!row) throw new NotFoundException(`Attachment ${attachmentId} not found`);
    await this.prisma.documentAttachment.delete({ where: { id: attachmentId } });
    await this.prisma.document.update({
      where: { id: documentId },
      data: { updatedById: actorId },
    });
    await this.recordActivity(documentId, actorId, 'attachment_removed', {
      fileAssetId: row.fileAssetId,
    });
  }

  private async assertPurposeMatchesMime(
    purpose: DocumentAttachmentPurposeEnum,
    fileAssetId: string,
  ) {
    if (purpose !== 'INLINE_IMAGE') return;
    const asset = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    const mime = asset?.mimeType ?? '';
    if (!mime.startsWith('image/')) {
      throw new BadRequestException('INLINE_IMAGE requires an image/* MIME type.');
    }
  }

  private async assertDocumentModifiable(documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException(`Document ${documentId} not found`);
    if (doc.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot change attachments on an archived document.');
    }
  }

  private async assertFileLinkedToDocument(fileAssetId: string, documentId: string) {
    const link = await this.prisma.fileLink.findFirst({
      where: { fileAssetId, entityType: 'DOCUMENT', entityId: documentId, unlinkedAt: null },
    });
    if (!link) {
      throw new BadRequestException(
        'File must be uploaded to this document first (Drive link DOCUMENT + document id).',
      );
    }
  }

  private async ensureDefaultSections() {
    const count = await this.prisma.documentSection.count();
    if (count > 0) return;
    this.logger.log('Seeding default document sections');
    for (const row of DEFAULT_DOCUMENT_SECTIONS) {
      await this.prisma.documentSection.upsert({
        where: { slug: row.slug },
        create: {
          name: row.name,
          slug: row.slug,
          description: row.description,
          sortOrder: row.sortOrder,
        },
        update: {},
      });
    }
  }

  private async recordActivity(
    documentId: string,
    actorId: string,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    await this.prisma.documentActivityEvent.create({
      data: {
        documentId,
        actorId,
        action,
        metadata: Object.keys(metadata).length > 0 ? (metadata as InputJsonValue) : undefined,
      },
    });
  }
}
