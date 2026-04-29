import { randomUUID } from 'node:crypto';
import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  PrismaClient,
  type DocumentAttachmentPurposeEnum,
  type DocumentListScopeEnum,
  type DocumentStatusEnum,
  type DocumentTypeEnum,
  type InputJsonValue,
  type Prisma,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { ensureDefaultDocumentSections } from './documents-default-sections';
import {
  assertDocumentModifiable,
  assertDocumentReadableByAccess,
  assertFileLinkedToDocument,
  assertPurposeMatchesMime,
} from './documents-assertions';
import {
  buildDocumentsReadableWhere,
  documentActivityEventsAllowed,
  employeeCanReadDocumentRow,
  resolveDocumentsReadContext,
  type DocumentsDetailAccess,
  type DocumentsReadAccess,
} from './documents-access-read';
import {
  isDocumentsListScopeOnlyPatch,
  shouldSkipDocumentsUpdateActivityAfterPatch,
} from './documents-update-policy';
import {
  DOCUMENT_LIST_INCLUDE,
  DOCUMENT_LIST_SEARCH_INCLUDE,
  DOCUMENT_DETAIL_INCLUDE,
  DOCUMENT_DETAIL_WITHOUT_ACTIVITY,
} from './documents-includes';
import {
  DOCUMENT_ACTIVITY_MAX_PAGE,
  DOCUMENT_ACTIVITY_PAGE_SIZE,
  DOCUMENT_AUDIT_ACTION_ACCESS_CHANGED,
  DOCUMENT_AUDIT_ACTION_SECTION_LIST_SCOPE_CHANGED,
  DOCUMENT_AUDIT_ENTITY_TYPE,
  DOCUMENT_LIST_LIMIT,
  DOCUMENT_SECTION_AUDIT_ENTITY_TYPE,
} from './documents.constants';
import {
  decodeDocumentActivityCursor,
  encodeDocumentActivityCursor,
} from './documents-activity-cursor';
import { searchDocumentIdsForList } from './documents-list-fts';
import {
  type AttachmentFileNameRow,
  collectAttachmentSearchNames,
  pickDocumentSearchSnippet,
} from './documents-search-snippet';
import { slugifyTitle } from './documents-slug';
import type {
  AddDocumentAttachmentDto,
  CreateDocumentDto,
  CreateDocumentTagDto,
  ListDocumentsQuery,
  UpdateDocumentDto,
  UpdateDocumentSectionDto,
} from './documents.types';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

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

  async listDocuments(query: ListDocumentsQuery, access: DocumentsReadAccess) {
    await this.ensureDefaultSections();
    const read = await resolveDocumentsReadContext(this.prisma, access);
    if (read.denied) return [];

    const where: Prisma.DocumentWhereInput = {
      AND: [buildDocumentsReadableWhere(read.viewScope, access.employeeId, read.colleagueIds)],
    };
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.status) where.status = query.status as DocumentStatusEnum;
    else if (!query.includeArchived) where.status = { not: 'ARCHIVED' };

    const searchTerm = query.search?.trim();
    if (!searchTerm) {
      return this.prisma.document.findMany({
        where,
        include: DOCUMENT_LIST_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        take: DOCUMENT_LIST_LIMIT,
      });
    }

    const ranked = await searchDocumentIdsForList(this.prisma, {
      term: searchTerm,
      sectionId: query.sectionId,
      status: query.status as DocumentStatusEnum | undefined,
      includeArchived: query.includeArchived === true,
      limit: DOCUMENT_LIST_LIMIT,
      viewScope: read.viewScope,
      employeeId: access.employeeId,
      colleagueIds: read.colleagueIds,
    });
    if (ranked.length === 0) return [];

    const order = new Map(ranked.map((r, i) => [r.id, i]));
    const ids = ranked.map((r) => r.id);
    const rows = await this.prisma.document.findMany({
      where: { ...where, id: { in: ids } },
      include: DOCUMENT_LIST_SEARCH_INCLUDE,
    });
    const sorted = [...rows].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return sorted.map((r) => {
      const { attachments, ...rest } = r;
      return {
        ...rest,
        searchSnippet: pickDocumentSearchSnippet(
          rest.plainText,
          rest.description,
          rest.title,
          searchTerm,
          collectAttachmentSearchNames(
            attachments as unknown as AttachmentFileNameRow[] | undefined,
          ),
        ),
      };
    });
  }

  async getDocument(id: string, access: DocumentsDetailAccess) {
    await this.ensureDefaultSections();
    const read = await resolveDocumentsReadContext(this.prisma, access);
    if (read.denied) throw new NotFoundException(`Document ${id} not found`);
    const includeActivity = documentActivityEventsAllowed(access);
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: includeActivity ? DOCUMENT_DETAIL_INCLUDE : DOCUMENT_DETAIL_WITHOUT_ACTIVITY,
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    if (
      !employeeCanReadDocumentRow(
        {
          ownerId: doc.ownerId,
          createdById: doc.createdById,
          listScopeOverride: doc.listScopeOverride,
          section: doc.section,
        },
        read.viewScope,
        access.employeeId,
        read.colleagueIds,
      )
    ) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    let activityEvents = includeActivity ? [...(doc.activityEvents ?? [])] : [];
    let activityNextCursor: string | null = null;
    if (includeActivity && activityEvents.length > DOCUMENT_ACTIVITY_PAGE_SIZE) {
      const oldestKept = activityEvents[DOCUMENT_ACTIVITY_PAGE_SIZE - 1];
      activityNextCursor =
        oldestKept !== undefined
          ? encodeDocumentActivityCursor(oldestKept.createdAt, oldestKept.id)
          : null;
      activityEvents = activityEvents.slice(0, DOCUMENT_ACTIVITY_PAGE_SIZE);
    }
    return {
      ...doc,
      activityEvents,
      activityRevealed: includeActivity,
      activityNextCursor: includeActivity ? activityNextCursor : null,
    };
  }

  async listDocumentActivity(
    documentId: string,
    query: { cursor?: string; limit?: number },
    access: DocumentsDetailAccess,
  ) {
    await this.ensureDefaultSections();
    const read = await resolveDocumentsReadContext(this.prisma, access);
    if (read.denied) throw new NotFoundException(`Document ${documentId} not found`);
    if (!documentActivityEventsAllowed(access)) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        ownerId: true,
        createdById: true,
        listScopeOverride: true,
        section: { select: { defaultListScope: true } },
      },
    });
    if (!doc) throw new NotFoundException(`Document ${documentId} not found`);
    if (
      !employeeCanReadDocumentRow(
        {
          ownerId: doc.ownerId,
          createdById: doc.createdById,
          listScopeOverride: doc.listScopeOverride,
          section: doc.section,
        },
        read.viewScope,
        access.employeeId,
        read.colleagueIds,
      )
    ) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    const rawLimit = query.limit;
    const parsedLimit =
      typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? Math.floor(rawLimit) : NaN;
    const limit = Math.min(
      DOCUMENT_ACTIVITY_MAX_PAGE,
      Math.max(1, Number.isNaN(parsedLimit) ? DOCUMENT_ACTIVITY_PAGE_SIZE : parsedLimit),
    );

    const cursorRaw = query.cursor?.trim();
    const cursorBoundary = cursorRaw ? decodeDocumentActivityCursor(cursorRaw) : undefined;

    const pageWhere: Prisma.DocumentActivityEventWhereInput = {
      documentId,
      ...(cursorBoundary
        ? {
            OR: [
              { createdAt: { lt: cursorBoundary.createdAt } },
              {
                AND: [{ createdAt: cursorBoundary.createdAt }, { id: { lt: cursorBoundary.id } }],
              },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.documentActivityEvent.findMany({
      where: pageWhere,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const oldestInPage = items[items.length - 1];
    const nextCursor =
      hasMore && oldestInPage
        ? encodeDocumentActivityCursor(oldestInPage.createdAt, oldestInPage.id)
        : null;
    return { items, nextCursor };
  }

  async createDocument(dto: CreateDocumentDto, actorId: string, access: DocumentsDetailAccess) {
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
    return this.getDocument(doc.id, access);
  }

  async updateDocument(
    id: string,
    dto: UpdateDocumentDto,
    actorId: string,
    access: DocumentsDetailAccess,
  ) {
    await this.ensureDefaultSections();
    const read = await resolveDocumentsReadContext(this.prisma, access);
    if (read.denied) throw new NotFoundException(`Document ${id} not found`);

    const existing = await this.prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        listScopeOverride: true,
        ownerId: true,
        createdById: true,
        section: { select: { defaultListScope: true } },
      },
    });
    if (!existing) throw new NotFoundException(`Document ${id} not found`);
    if (
      !employeeCanReadDocumentRow(
        {
          ownerId: existing.ownerId,
          createdById: existing.createdById,
          listScopeOverride: existing.listScopeOverride,
          section: existing.section,
        },
        read.viewScope,
        access.employeeId,
        read.colleagueIds,
      )
    ) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    if (dto.sectionId) {
      const section = await this.prisma.documentSection.findFirst({
        where: { id: dto.sectionId, archivedAt: null },
      });
      if (!section) throw new NotFoundException(`Section ${dto.sectionId} not found`);
    }

    const data: Prisma.DocumentUpdateInput = { updatedById: actorId };
    let accessScopeChanged = false;
    if (dto.listScopeOverride !== undefined) {
      const prev = existing.listScopeOverride;
      if (dto.listScopeOverride === null) {
        data.listScopeOverride = null;
        accessScopeChanged = prev !== null;
      } else {
        const v = dto.listScopeOverride.trim().toUpperCase();
        if (v !== 'ALL' && v !== 'OWN' && v !== 'DEPARTMENT') {
          throw new BadRequestException('listScopeOverride must be ALL, OWN, DEPARTMENT, or null.');
        }
        const next = v as DocumentListScopeEnum;
        data.listScopeOverride = next;
        accessScopeChanged = prev !== next;
      }
    }

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

    if (accessScopeChanged) {
      await this.recordActivity(id, actorId, 'access_changed', {
        listScopeOverride: dto.listScopeOverride ?? null,
        previousListScopeOverride: existing.listScopeOverride,
      });
      await this.auditService.log({
        entityType: DOCUMENT_AUDIT_ENTITY_TYPE,
        entityId: id,
        action: DOCUMENT_AUDIT_ACTION_ACCESS_CHANGED,
        userId: actorId,
        changes: {
          listScopeOverride: dto.listScopeOverride ?? null,
          previousListScopeOverride: existing.listScopeOverride,
          sectionDefaultListScope: existing.section.defaultListScope,
        },
      });
    }

    const shouldSkipUpdateActivity = shouldSkipDocumentsUpdateActivityAfterPatch(existing, dto);
    const skipGenericActivity =
      shouldSkipUpdateActivity || (accessScopeChanged && isDocumentsListScopeOnlyPatch(dto));
    if (!skipGenericActivity) {
      const action =
        dto.status === 'PUBLISHED' && existing.status === 'DRAFT' ? 'published' : 'updated';
      await this.recordActivity(id, actorId, action, {});
    }
    return this.getDocument(id, access);
  }

  async archiveDocument(id: string, actorId: string, access: DocumentsDetailAccess) {
    await this.ensureDefaultSections();
    await assertDocumentReadableByAccess(this.prisma, id, access);
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
    return this.getDocument(id, access);
  }

  async addDocumentAttachment(
    documentId: string,
    dto: AddDocumentAttachmentDto,
    actorId: string,
    access: DocumentsDetailAccess,
  ) {
    await this.ensureDefaultSections();
    await assertDocumentReadableByAccess(this.prisma, documentId, access);
    const fileAssetId = dto.fileAssetId?.trim();
    if (!fileAssetId) throw new BadRequestException('fileAssetId is required.');
    await assertDocumentModifiable(this.prisma, documentId);
    await assertFileLinkedToDocument(this.prisma, fileAssetId, documentId);
    const purpose = (dto.purpose ?? 'ATTACHMENT') as DocumentAttachmentPurposeEnum;
    await assertPurposeMatchesMime(this.prisma, purpose, fileAssetId);
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
    return this.getDocument(documentId, access);
  }

  async updateDocumentSection(sectionId: string, dto: UpdateDocumentSectionDto, actorId: string) {
    await this.ensureDefaultSections();
    const raw = dto.defaultListScope?.trim().toUpperCase();
    if (!raw || (raw !== 'ALL' && raw !== 'OWN' && raw !== 'DEPARTMENT')) {
      throw new BadRequestException('defaultListScope must be ALL, OWN, or DEPARTMENT.');
    }
    const nextScope = raw as DocumentListScopeEnum;
    const existing = await this.prisma.documentSection.findFirst({
      where: { id: sectionId, archivedAt: null },
    });
    if (!existing) throw new NotFoundException(`Section ${sectionId} not found`);
    if (existing.defaultListScope === nextScope) return existing;

    const updated = await this.prisma.documentSection.update({
      where: { id: sectionId },
      data: { defaultListScope: nextScope, updatedById: actorId },
    });
    await this.auditService.log({
      entityType: DOCUMENT_SECTION_AUDIT_ENTITY_TYPE,
      entityId: sectionId,
      action: DOCUMENT_AUDIT_ACTION_SECTION_LIST_SCOPE_CHANGED,
      userId: actorId,
      changes: {
        from: existing.defaultListScope,
        to: nextScope,
        sectionSlug: existing.slug,
      },
    });
    return updated;
  }

  async removeDocumentAttachment(
    documentId: string,
    attachmentId: string,
    actorId: string,
    access: DocumentsDetailAccess,
  ) {
    await this.ensureDefaultSections();
    await assertDocumentReadableByAccess(this.prisma, documentId, access);
    await assertDocumentModifiable(this.prisma, documentId);
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

  private async ensureDefaultSections() {
    await ensureDefaultDocumentSections(this.prisma, (m) => this.logger.log(m));
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
