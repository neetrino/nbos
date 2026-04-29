import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentsService } from './documents.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    service = new DocumentsService(prisma as never);
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
    prisma.documentSection.count.mockResolvedValueOnce(0).mockResolvedValueOnce(10);
    prisma.documentSection.findFirst.mockResolvedValueOnce({ id: 'sec', archivedAt: null });
    prisma.document.create.mockResolvedValueOnce({ id: 'doc-1' });
    prisma.documentActivityEvent.create.mockResolvedValueOnce({ id: 'ev-1' });
    prisma.document.findUnique.mockResolvedValueOnce({
      id: 'doc-1',
      title: 'Hello',
      section: { id: 'sec', name: 'Technical', slug: 'technical', sortOrder: 80 },
      tagLinks: [],
      activityEvents: [],
    });

    const doc = await service.createDocument({ title: 'Hello', sectionId: 'sec' }, 'employee-1');

    expect(doc.id).toBe('doc-1');
    expect(prisma.document.create).toHaveBeenCalled();
    expect(prisma.documentActivityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'created', actorId: 'employee-1' }),
      }),
    );
  });

  it('skips activity for content-only update when recordActivity is false', async () => {
    prisma.document.findUnique.mockResolvedValueOnce({
      id: 'doc-1',
      status: 'DRAFT',
    });
    prisma.document.update.mockResolvedValueOnce({});
    prisma.document.findUnique.mockResolvedValueOnce({
      id: 'doc-1',
      title: 'T',
      section: { id: 's', name: 'S', slug: 's', sortOrder: 1 },
      tagLinks: [],
      activityEvents: [],
    });

    await service.updateDocument(
      'doc-1',
      { contentJson: { type: 'doc', content: [] }, recordActivity: false },
      'user-1',
    );

    expect(prisma.document.update).toHaveBeenCalled();
    expect(prisma.documentActivityEvent.create).not.toHaveBeenCalled();
  });

  it('still records published when publishing draft even if recordActivity is false', async () => {
    prisma.document.findUnique.mockResolvedValueOnce({
      id: 'doc-1',
      status: 'DRAFT',
    });
    prisma.document.update.mockResolvedValueOnce({});
    prisma.document.findUnique.mockResolvedValueOnce({
      id: 'doc-1',
      title: 'T',
      section: { id: 's', name: 'S', slug: 's', sortOrder: 1 },
      tagLinks: [],
      activityEvents: [],
    });

    await service.updateDocument(
      'doc-1',
      { status: 'PUBLISHED', contentJson: { type: 'doc', content: [] }, recordActivity: false },
      'user-1',
    );

    expect(prisma.documentActivityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'published', actorId: 'user-1' }),
      }),
    );
  });
});
