import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { addContactToProduct, ensureContactOnProject } from './product-contacts.ops';

describe('product-contacts.ops', () => {
  it('adds Contact as Project additional when Project already has a primary', async () => {
    const prisma = createMockPrisma();
    prisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      contactId: 'primary-1',
      trashedAt: null,
    });

    const role = await ensureContactOnProject(prisma as never, 'proj-1', 'extra-1');
    expect(role).toBe('additional');
    expect(prisma.projectAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ projectId: 'proj-1', contactId: 'extra-1' }],
      skipDuplicates: true,
    });
  });

  it('places Contact on Product and cascades to Project', async () => {
    const prisma = createMockPrisma();
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      contactId: 'primary-1',
      projectId: 'proj-1',
      project: { trashedAt: null },
    });
    prisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      contactId: 'primary-1',
      trashedAt: null,
    });

    const result = await addContactToProduct(prisma as never, 'prod-1', 'extra-1');
    expect(result).toEqual({ role: 'additional', projectId: 'proj-1' });
    expect(prisma.productAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ productId: 'prod-1', contactId: 'extra-1' }],
      skipDuplicates: true,
    });
  });
});
