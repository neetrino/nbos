import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { encodeDocumentActivityCursor } from './documents-activity-cursor';

const readAllAccess = {
  employeeId: 'employee-1',
  departmentIds: [] as string[],
  documentsViewScope: 'ALL' as const,
};

const detailAccessAll = {
  ...readAllAccess,
  documentsViewActivityScope: 'ALL' as const,
};

const detailDoc = {
  id: 'doc-1',
  title: 'Hello',
  ownerId: 'employee-1',
  createdById: 'employee-1',
  listScopeOverride: null,
  section: {
    id: 'sec',
    name: 'Technical',
    slug: 'technical',
    sortOrder: 80,
    defaultListScope: 'ALL',
  },
  tagLinks: [],
  attachments: [],
  activityEvents: [],
};

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: MockPrisma;
  const audit = { log: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
    service = new DocumentsService(prisma as never, audit as never);
  });

  it('listDocuments uses FTS query then loads rows by id in rank order', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.$queryRaw.mockResolvedValueOnce([
      { id: 'doc-2', rank: 0.2 },
      { id: 'doc-1', rank: 0.8 },
    ]);
    prisma.document.findMany.mockResolvedValueOnce([
      {
        id: 'doc-1',
        title: 'A',
        plainText: null,
        description: null,
        section: { id: 's', name: 'S', slug: 's', sortOrder: 1, defaultListScope: 'ALL' },
        tagLinks: [],
      },
      {
        id: 'doc-2',
        title: 'B',
        plainText: null,
        description: null,
        section: { id: 's', name: 'S', slug: 's', sortOrder: 1, defaultListScope: 'ALL' },
        tagLinks: [],
      },
    ]);

    const rows = await service.listDocuments({ search: '  payroll  ' }, readAllAccess);

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['doc-2', 'doc-1'] } }),
      }),
    );
    expect(rows.map((r) => r.id)).toEqual(['doc-2', 'doc-1']);
    expect(rows[0]).toHaveProperty('searchSnippet');
  });

  it('seeds default sections when count is zero', async () => {
    prisma.documentSection.count.mockResolvedValueOnce(0);
    prisma.documentSection.findMany.mockResolvedValueOnce([
      { id: 's1', name: 'Technical', slug: 'technical', sortOrder: 80 },
    ]);

    const result = await service.listSections();

    expect(prisma.documentSection.upsert).toHaveBeenCalled();
    expect(result[0]!.slug).toBe('technical');
  });

  it('creates a document and records activity', async () => {
    prisma.documentSection.count.mockResolvedValueOnce(0).mockResolvedValue(10);
    prisma.documentSection.findFirst.mockResolvedValueOnce({ id: 'sec', archivedAt: null });
    prisma.document.create.mockResolvedValueOnce({ id: 'doc-1' });
    prisma.documentActivityEvent.create.mockResolvedValueOnce({ id: 'ev-1' });
    prisma.document.findUnique.mockResolvedValueOnce(detailDoc);

    const doc = await service.createDocument(
      { title: 'Hello', sectionId: 'sec' },
      'employee-1',
      detailAccessAll,
    );

    expect(doc.id).toBe('doc-1');
    expect(prisma.document.create).toHaveBeenCalled();
    expect(prisma.documentActivityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'created', actorId: 'employee-1' }),
      }),
    );
  });

  it('adds document attachment when file is linked to the document', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.document.findUnique
      .mockResolvedValueOnce({
        ownerId: 'user-1',
        createdById: 'user-1',
        listScopeOverride: null,
        section: { defaultListScope: 'ALL' },
      })
      .mockResolvedValueOnce({ id: 'doc-1', status: 'DRAFT' })
      .mockResolvedValueOnce({
        ...detailDoc,
        id: 'doc-1',
        title: 'T',
        section: { id: 's', name: 'S', slug: 's', sortOrder: 1, defaultListScope: 'ALL' },
      });
    prisma.fileLink.findFirst.mockResolvedValueOnce({ id: 'link-1' });
    prisma.fileAsset.findUnique.mockResolvedValueOnce({ id: 'fa-1', mimeType: 'image/png' });
    prisma.documentAttachment.findFirst.mockResolvedValueOnce(null);
    prisma.documentAttachment.create.mockResolvedValue({ id: 'att-1' });
    prisma.document.update.mockResolvedValue({});
    prisma.documentActivityEvent.create.mockResolvedValue({});

    await service.addDocumentAttachment(
      'doc-1',
      { fileAssetId: 'fa-1', purpose: 'INLINE_IMAGE' },
      'user-1',
      {
        employeeId: 'user-1',
        departmentIds: [],
        documentsViewScope: 'ALL',
        documentsViewActivityScope: 'ALL',
      },
    );

    expect(prisma.documentAttachment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentId: 'doc-1',
          fileAssetId: 'fa-1',
          purpose: 'INLINE_IMAGE',
        }),
      }),
    );
  });

  it('skips activity for content-only update when recordActivity is false', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.document.findUnique
      .mockResolvedValueOnce({
        id: 'doc-1',
        status: 'DRAFT',
        listScopeOverride: null,
        ownerId: 'user-1',
        createdById: 'user-1',
        section: { defaultListScope: 'ALL' },
      })
      .mockResolvedValueOnce({
        id: 'doc-1',
        title: 'T',
        section: { id: 's', name: 'S', slug: 's', sortOrder: 1, defaultListScope: 'ALL' },
        tagLinks: [],
        attachments: [],
        activityEvents: [],
      });
    prisma.document.update.mockResolvedValueOnce({});

    await service.updateDocument(
      'doc-1',
      { contentJson: { type: 'doc', content: [] }, recordActivity: false },
      'user-1',
      {
        employeeId: 'user-1',
        departmentIds: [],
        documentsViewScope: 'ALL',
        documentsViewActivityScope: 'ALL',
      },
    );

    expect(prisma.document.update).toHaveBeenCalled();
    expect(prisma.documentActivityEvent.create).not.toHaveBeenCalled();
  });

  it('still records published when publishing draft even if recordActivity is false', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.document.findUnique
      .mockResolvedValueOnce({
        id: 'doc-1',
        status: 'DRAFT',
        listScopeOverride: null,
        ownerId: 'user-1',
        createdById: 'user-1',
        section: { defaultListScope: 'ALL' },
      })
      .mockResolvedValueOnce({
        id: 'doc-1',
        title: 'T',
        section: { id: 's', name: 'S', slug: 's', sortOrder: 1, defaultListScope: 'ALL' },
        tagLinks: [],
        attachments: [],
        activityEvents: [],
      });
    prisma.document.update.mockResolvedValueOnce({});
    prisma.documentActivityEvent.create.mockResolvedValue({});

    await service.updateDocument(
      'doc-1',
      { status: 'PUBLISHED', contentJson: { type: 'doc', content: [] }, recordActivity: false },
      'user-1',
      {
        employeeId: 'user-1',
        departmentIds: [],
        documentsViewScope: 'ALL',
        documentsViewActivityScope: 'ALL',
      },
    );

    expect(prisma.documentActivityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'published', actorId: 'user-1' }),
      }),
    );
  });

  it('writes global audit when list scope override changes', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.document.findUnique
      .mockResolvedValueOnce({
        id: 'doc-1',
        status: 'DRAFT',
        listScopeOverride: null,
        ownerId: 'user-1',
        createdById: 'user-1',
        section: { defaultListScope: 'ALL' },
      })
      .mockResolvedValueOnce({
        id: 'doc-1',
        title: 'T',
        section: { id: 's', name: 'S', slug: 's', sortOrder: 1, defaultListScope: 'ALL' },
        tagLinks: [],
        attachments: [],
        activityEvents: [],
      });
    prisma.document.update.mockResolvedValueOnce({});
    prisma.documentActivityEvent.create.mockResolvedValue({});

    await service.updateDocument('doc-1', { listScopeOverride: 'OWN' }, 'user-1', {
      employeeId: 'user-1',
      departmentIds: [],
      documentsViewScope: 'ALL',
      documentsViewActivityScope: 'ALL',
    });

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'DOCUMENT',
        entityId: 'doc-1',
        action: 'document_access_changed',
        userId: 'user-1',
      }),
    );
  });

  it('trims document detail activity to page size and exposes activityNextCursor', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    const base = Date.UTC(2026, 0, 1, 12, 0, 0);
    const activityEvents = Array.from({ length: 31 }, (_, idx) => ({
      id: `00000000-0000-4000-8000-${String(100000 + idx).padStart(12, '0')}`,
      action: 'updated',
      actorId: 'employee-1',
      metadata: {},
      createdAt: new Date(base + (31 - idx) * 1000),
    }));
    prisma.document.findUnique.mockResolvedValueOnce({
      ...detailDoc,
      activityEvents,
    });

    const doc = await service.getDocument('doc-1', detailAccessAll);

    expect(doc.activityEvents).toHaveLength(30);
    expect(doc.activityNextCursor).toBeTruthy();
    const oldestShown = activityEvents[29];
    expect(doc.activityNextCursor).toBe(
      encodeDocumentActivityCursor(oldestShown.createdAt, oldestShown.id),
    );
  });

  it('lists older document activity after cursor', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.document.findUnique.mockResolvedValueOnce({
      id: 'doc-1',
      ownerId: 'employee-1',
      createdById: 'employee-1',
      listScopeOverride: null,
      section: { defaultListScope: 'ALL' },
    });
    const t0 = new Date('2026-02-01T10:00:00.000Z');
    const t1 = new Date('2026-02-01T09:00:00.000Z');
    prisma.documentActivityEvent.findMany.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-000000000002',
        documentId: 'doc-1',
        action: 'archived',
        actorId: 'employee-1',
        metadata: {},
        createdAt: t0,
      },
      {
        id: '00000000-0000-4000-8000-000000000001',
        documentId: 'doc-1',
        action: 'published',
        actorId: 'employee-1',
        metadata: {},
        createdAt: t1,
      },
    ]);

    const cursor = encodeDocumentActivityCursor(
      new Date('2026-02-01T11:00:00.000Z'),
      '00000000-0000-4000-8000-000000000099',
    );
    const page = await service.listDocumentActivity(
      'doc-1',
      { cursor, limit: 10 },
      detailAccessAll,
    );

    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
    expect(prisma.documentActivityEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          documentId: 'doc-1',
          OR: expect.any(Array),
        }),
        take: 11,
      }),
    );
  });

  it('restores archived document to PUBLISHED when it was published before', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
    prisma.document.findUnique
      .mockResolvedValueOnce({
        ownerId: 'employee-1',
        createdById: 'employee-1',
        listScopeOverride: null,
        section: { defaultListScope: 'ALL' },
      })
      .mockResolvedValueOnce({
        id: 'doc-1',
        status: 'ARCHIVED',
        publishedAt: new Date('2026-01-01'),
      })
      .mockResolvedValueOnce({ ...detailDoc, id: 'doc-1', status: 'PUBLISHED', archivedAt: null });
    prisma.document.update.mockResolvedValue({});
    prisma.documentActivityEvent.create.mockResolvedValue({});

    const doc = await service.restoreDocument('doc-1', 'employee-1', detailAccessAll);

    expect(doc.status).toBe('PUBLISHED');
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PUBLISHED',
          archivedAt: null,
        }),
      }),
    );
    expect(prisma.documentActivityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'restored', metadata: { status: 'PUBLISHED' } }),
      }),
    );
  });

  it('restores archived document to DRAFT when never published', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
    prisma.document.findUnique
      .mockResolvedValueOnce({
        ownerId: 'employee-1',
        createdById: 'employee-1',
        listScopeOverride: null,
        section: { defaultListScope: 'ALL' },
      })
      .mockResolvedValueOnce({
        id: 'doc-1',
        status: 'ARCHIVED',
        publishedAt: null,
      })
      .mockResolvedValueOnce({ ...detailDoc, id: 'doc-1', status: 'DRAFT', archivedAt: null });
    prisma.document.update.mockResolvedValue({});
    prisma.documentActivityEvent.create.mockResolvedValue({});

    const doc = await service.restoreDocument('doc-1', 'employee-1', detailAccessAll);

    expect(doc.status).toBe('DRAFT');
    expect(prisma.documentActivityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'restored', metadata: { status: 'DRAFT' } }),
      }),
    );
  });

  it('rejects invalid activity cursor on listDocumentActivity', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.document.findUnique.mockResolvedValueOnce({
      id: 'doc-1',
      ownerId: 'employee-1',
      createdById: 'employee-1',
      listScopeOverride: null,
      section: { defaultListScope: 'ALL' },
    });

    await expect(
      service.listDocumentActivity('doc-1', { cursor: '!!!' }, detailAccessAll),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates section default list scope and writes audit', async () => {
    prisma.documentSection.count.mockResolvedValue(10);
    prisma.documentSection.findFirst.mockResolvedValueOnce({
      id: 'sec-1',
      slug: 'technical',
      defaultListScope: 'ALL',
      archivedAt: null,
    });
    prisma.documentSection.update.mockResolvedValueOnce({
      id: 'sec-1',
      slug: 'technical',
      defaultListScope: 'OWN',
    });

    const row = await service.updateDocumentSection(
      'sec-1',
      { defaultListScope: 'OWN' },
      'admin-1',
    );

    expect(row.defaultListScope).toBe('OWN');
    expect(prisma.documentSection.update).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'DOCUMENT_SECTION',
        entityId: 'sec-1',
        action: 'document_section_list_scope_changed',
        userId: 'admin-1',
      }),
    );
  });
});
