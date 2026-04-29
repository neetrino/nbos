import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentsService } from './documents.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

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
