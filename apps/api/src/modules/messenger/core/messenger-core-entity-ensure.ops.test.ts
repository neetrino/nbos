import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWorkSpaceParticipationWhere } from '../../tasks/task-workspace-access.op';
import {
  ensureDealConversation,
  ensureProductWorkConversation,
  ensureProjectGeneralConversation,
  ensureWorkSpaceConversation,
} from './messenger-core-entity-ensure.ops';
import { productCanonicalKey, workspaceCanonicalKey } from './messenger-core-canonical-key';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001';
const WORKSPACE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002';
const STANDALONE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003';
const DEAL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0004';
const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005';
const EXTENSION_WS_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0006';
const PARENT_PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0007';
const EMPLOYEE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OUTSIDER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TASKS_VIEW_OWN = 'OWN';
const TASKS_VIEW_NONE = 'NONE';

function orgLevelStandaloneRow(id = STANDALONE_ID) {
  return {
    id,
    name: 'CEO planning',
    productId: null,
    projectId: null,
    extensionId: null,
    type: 'STANDALONE_OPERATIONAL',
  };
}

function connectedWorkspaceRow() {
  return {
    id: WORKSPACE_ID,
    name: 'Website space',
    productId: PRODUCT_ID,
    projectId: PROJECT_ID,
    extensionId: null,
    type: 'PRODUCT_DELIVERY',
  };
}

function conversationRow(id: string, type: string, canonicalKey: string): Record<string, unknown> {
  return {
    id,
    zone: 'INTERNAL',
    type,
    title: 'Row',
    status: 'ACTIVE',
    canonicalKey,
    createdAt: new Date(),
    lastMessageAt: null,
  };
}

function mappedRow(id: string, messageCount: number) {
  return { id, _count: { messages: messageCount } };
}

function createPrisma() {
  return {
    product: { findUnique: vi.fn(), findFirst: vi.fn() },
    workSpace: { findUnique: vi.fn(), findFirst: vi.fn() },
    deal: { findUnique: vi.fn(), findFirst: vi.fn() },
    project: { findUnique: vi.fn(), findFirst: vi.fn() },
    messengerConversation: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
    },
    messengerConversationLink: {
      findFirst: vi.fn().mockResolvedValue(null),
      createMany: vi.fn(),
    },
    messengerConversationParticipant: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn(),
    },
    messengerChannelMessage: { create: vi.fn() },
    messengerDirectMessage: { create: vi.fn() },
    messengerMessage: { create: vi.fn() },
  };
}

function grantProductAccess(prisma: ReturnType<typeof createPrisma>) {
  prisma.product.findFirst.mockResolvedValue({
    id: PRODUCT_ID,
    name: 'Website',
    projectId: PROJECT_ID,
    workSpace: { id: WORKSPACE_ID },
  });
  prisma.product.findUnique.mockResolvedValue({ id: PRODUCT_ID, projectId: PROJECT_ID });
}

function mockMappedGroups(
  prisma: ReturnType<typeof createPrisma>,
  proven: ReturnType<typeof mappedRow>[],
  nameOnly: ReturnType<typeof mappedRow>[] = [],
) {
  prisma.messengerConversation.findMany.mockImplementation(
    async (args: { where?: { title?: string } }) => {
      if (args.where?.title) return nameOnly;
      return proven;
    },
  );
}

describe('entity conversation ensure', () => {
  let prisma: ReturnType<typeof createPrisma>;

  beforeEach(() => {
    prisma = createPrisma();
    grantProductAccess(prisma);
    prisma.workSpace.findUnique.mockResolvedValue(connectedWorkspaceRow());
    prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, name: 'Acme' });
    prisma.project.findUnique.mockResolvedValue({
      id: PROJECT_ID,
      teamMembers: [{ employeeId: EMPLOYEE_ID }],
      products: [],
      extensions: [],
      orders: [],
    });
    prisma.deal.findFirst.mockResolvedValue({
      id: DEAL_ID,
      name: 'Offer A',
      code: 'D-1',
      sellerId: EMPLOYEE_ID,
      sellerAssistantId: null,
      pmId: null,
      projectId: null,
    });
    prisma.deal.findUnique.mockResolvedValue({
      id: DEAL_ID,
      name: 'Offer A',
      code: 'D-1',
      sellerId: EMPLOYEE_ID,
      sellerAssistantId: null,
      pmId: null,
      projectId: null,
    });
  });

  it('returns the same conversationId for Product Chat and Connected Work Space Discussion', async () => {
    const row = conversationRow('conv-product', 'PRODUCT', productCanonicalKey(PRODUCT_ID));
    prisma.messengerConversation.findUnique.mockResolvedValue(row);
    const fromProduct = await ensureProductWorkConversation(
      prisma as never,
      PRODUCT_ID,
      EMPLOYEE_ID,
    );
    const fromWorkspace = await ensureWorkSpaceConversation(
      prisma as never,
      WORKSPACE_ID,
      EMPLOYEE_ID,
    );
    expect(fromProduct.id).toBe('conv-product');
    expect(fromWorkspace.id).toBe(fromProduct.id);
    expect(fromProduct.type).toBe('PRODUCT');
    expect(fromWorkspace.type).toBe('PRODUCT');
    expect(prisma.workSpace.findFirst).not.toHaveBeenCalled();
  });

  it('recovers a unique-constraint race to a single Product conversation', async () => {
    const key = productCanonicalKey(PRODUCT_ID);
    const winner = conversationRow('winner', 'PRODUCT', key);
    let stored: Record<string, unknown> | null = null;
    prisma.messengerConversation.findUnique.mockImplementation(
      async (args: { where: { canonicalKey?: string } }) => {
        if (args.where.canonicalKey === key) return stored;
        return null;
      },
    );
    prisma.messengerConversation.create.mockImplementation(async () => {
      if (stored) throw { code: 'P2002' };
      stored = winner;
      return winner;
    });
    const [first, second] = await Promise.all([
      ensureProductWorkConversation(prisma as never, PRODUCT_ID, EMPLOYEE_ID),
      ensureProductWorkConversation(prisma as never, PRODUCT_ID, EMPLOYEE_ID),
    ]);
    expect(first.id).toBe('winner');
    expect(second.id).toBe('winner');
  });

  it('does not require a Product id or PRODUCT type for a standalone Work Space', async () => {
    prisma.workSpace.findUnique.mockResolvedValue(orgLevelStandaloneRow());
    prisma.workSpace.findFirst.mockImplementation(async (args: { where: unknown }) => {
      expect(args.where).toEqual({
        id: STANDALONE_ID,
        ...buildWorkSpaceParticipationWhere([EMPLOYEE_ID]),
      });
      return null;
    });
    const key = workspaceCanonicalKey(STANDALONE_ID);
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue(
      conversationRow('conv-ws', 'WORKSPACE', key),
    );
    const created = await ensureWorkSpaceConversation(
      prisma as never,
      STANDALONE_ID,
      EMPLOYEE_ID,
      TASKS_VIEW_OWN,
    );
    expect(created.type).toBe('WORKSPACE');
    expect(created.canonicalKey).toBe(key);
    const data = prisma.messengerConversation.create.mock.calls[0]?.[0]?.data as {
      type: string;
      links: { create: Array<{ entityType: string }> };
      participants: { create: Array<{ employeeId: string; role: string }> };
    };
    expect(data.type).toBe('WORKSPACE');
    expect(data.links.create.every((link) => link.entityType === 'WORKSPACE')).toBe(true);
    expect(data.participants.create).toEqual([{ employeeId: EMPLOYEE_ID, role: 'OWNER' }]);
  });

  it('creates Internal DEAL, never CLIENT or EXTERNAL', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue(
      conversationRow('conv-deal', 'DEAL', `deal:${DEAL_ID}`),
    );
    const created = await ensureDealConversation(prisma as never, DEAL_ID, EMPLOYEE_ID);
    expect(created.zone).toBe('INTERNAL');
    expect(created.type).toBe('DEAL');
    const data = prisma.messengerConversation.create.mock.calls[0]?.[0]?.data as {
      zone: string;
      type: string;
    };
    expect(data.zone).toBe('INTERNAL');
    expect(data.type).toBe('DEAL');
    expect(data.type).not.toBe('EXTERNAL');
  });

  it('does not duplicate messages when ensure is called twice', async () => {
    const row = conversationRow('conv-product', 'PRODUCT', productCanonicalKey(PRODUCT_ID));
    prisma.messengerConversation.findUnique.mockResolvedValue(row);
    await ensureProductWorkConversation(prisma as never, PRODUCT_ID, EMPLOYEE_ID);
    await ensureProductWorkConversation(prisma as never, PRODUCT_ID, EMPLOYEE_ID);
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(prisma.messengerChannelMessage.create).not.toHaveBeenCalled();
    expect(prisma.messengerDirectMessage.create).not.toHaveBeenCalled();
  });

  it('preserves a mapped group with history instead of silently overwriting it', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    mockMappedGroups(prisma, [], [mappedRow('mapped-group', 4)]);
    prisma.messengerConversation.create.mockResolvedValue(
      conversationRow('conv-product', 'PRODUCT', productCanonicalKey(PRODUCT_ID)),
    );
    const created = await ensureProductWorkConversation(prisma as never, PRODUCT_ID, EMPLOYEE_ID);
    expect(created.id).toBe('conv-product');
    expect(prisma.messengerConversation.update).not.toHaveBeenCalled();
    const data = prisma.messengerConversation.create.mock.calls[0]?.[0]?.data as {
      metadata: { legacyOverlapPreservedIds?: string[] };
    };
    expect(data.metadata.legacyOverlapPreservedIds).toEqual(['mapped-group']);
  });

  it('does not relink an empty mapped group that matches only title and projectId', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    mockMappedGroups(prisma, [], [mappedRow('empty-name-only', 0)]);
    prisma.messengerConversation.create.mockResolvedValue(
      conversationRow('conv-product', 'PRODUCT', productCanonicalKey(PRODUCT_ID)),
    );
    const created = await ensureProductWorkConversation(prisma as never, PRODUCT_ID, EMPLOYEE_ID);
    expect(created.id).toBe('conv-product');
    expect(prisma.messengerConversation.update).not.toHaveBeenCalled();
    expect(prisma.messengerConversation.create).toHaveBeenCalled();
  });

  it('relinks an empty mapped group with proven Product identity', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    mockMappedGroups(prisma, [mappedRow('empty-proven', 0)]);
    prisma.messengerConversation.update.mockResolvedValue(
      conversationRow('empty-proven', 'PRODUCT', productCanonicalKey(PRODUCT_ID)),
    );
    const created = await ensureProductWorkConversation(prisma as never, PRODUCT_ID, EMPLOYEE_ID);
    expect(created.id).toBe('empty-proven');
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.messengerConversation.update).toHaveBeenCalled();
  });

  it('does not fold an Extension Work Space into Product Chat', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({
      id: EXTENSION_WS_ID,
      name: 'Extension space',
      productId: null,
      projectId: PROJECT_ID,
      extensionId: 'ext-1',
      type: 'EXTENSION_DELIVERY',
    });
    prisma.workSpace.findFirst.mockResolvedValue({ id: EXTENSION_WS_ID });
    const key = workspaceCanonicalKey(EXTENSION_WS_ID);
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue(
      conversationRow('conv-ext', 'WORKSPACE', key),
    );
    const created = await ensureWorkSpaceConversation(
      prisma as never,
      EXTENSION_WS_ID,
      EMPLOYEE_ID,
      TASKS_VIEW_NONE,
    );
    expect(created.type).toBe('WORKSPACE');
    expect(created.canonicalKey).toBe(key);
    expect(created.canonicalKey).not.toBe(productCanonicalKey(PARENT_PRODUCT_ID));
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
  });
});

describe('entity access before ensure', () => {
  it('404s Product ensure for an OWN non-member and writes nothing', async () => {
    const prisma = createPrisma();
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(
      ensureProductWorkConversation(prisma as never, PRODUCT_ID, OUTSIDER_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.messengerConversation.update).not.toHaveBeenCalled();
    expect(prisma.messengerConversationParticipant.createMany).not.toHaveBeenCalled();
  });

  it('404s Work Space, Deal, and Project General ensure for an OWN non-member', async () => {
    const prisma = createPrisma();
    prisma.workSpace.findUnique.mockResolvedValue(null);
    prisma.deal.findFirst.mockResolvedValue(null);
    prisma.deal.findUnique.mockResolvedValue({
      id: DEAL_ID,
      name: 'Offer A',
      code: 'D-1',
      sellerId: EMPLOYEE_ID,
      sellerAssistantId: null,
      pmId: null,
      projectId: null,
    });
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(
      ensureWorkSpaceConversation(prisma as never, WORKSPACE_ID, OUTSIDER_ID, TASKS_VIEW_OWN),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      ensureDealConversation(prisma as never, DEAL_ID, OUTSIDER_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      ensureProjectGeneralConversation(prisma as never, PROJECT_ID, OUTSIDER_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.messengerConversationParticipant.createMany).not.toHaveBeenCalled();
  });

  it('seeds a team member as a participant on Product ensure', async () => {
    const prisma = createPrisma();
    grantProductAccess(prisma);
    prisma.project.findUnique.mockResolvedValue({
      id: PROJECT_ID,
      teamMembers: [{ employeeId: EMPLOYEE_ID }],
      products: [],
      extensions: [],
      orders: [],
    });
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue(
      conversationRow('conv-product', 'PRODUCT', productCanonicalKey(PRODUCT_ID)),
    );
    await ensureProductWorkConversation(prisma as never, PRODUCT_ID, EMPLOYEE_ID);
    const data = prisma.messengerConversation.create.mock.calls[0]?.[0]?.data as {
      participants: { create: Array<{ employeeId: string; role: string }> };
    };
    expect(data.participants.create).toEqual(
      expect.arrayContaining([{ employeeId: EMPLOYEE_ID, role: 'OWNER' }]),
    );
  });
});

describe('FINDING-S4-04 standalone Work Space access', () => {
  it('404s org-level standalone when TASKS.VIEW is NONE and writes nothing', async () => {
    const prisma = createPrisma();
    prisma.workSpace.findUnique.mockResolvedValue(orgLevelStandaloneRow());
    prisma.workSpace.findFirst.mockImplementation(async (args: { where: unknown }) => {
      expect(args.where).toEqual({
        id: STANDALONE_ID,
        ...buildWorkSpaceParticipationWhere([EMPLOYEE_ID]),
      });
      return null;
    });
    await expect(
      ensureWorkSpaceConversation(prisma as never, STANDALONE_ID, EMPLOYEE_ID, TASKS_VIEW_NONE),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.messengerConversationParticipant.createMany).not.toHaveBeenCalled();
  });

  it('ensures org-level standalone via task involvement without TASKS.VIEW fallback', async () => {
    const prisma = createPrisma();
    prisma.workSpace.findUnique.mockResolvedValue(orgLevelStandaloneRow());
    prisma.workSpace.findFirst.mockImplementation(async (args: { where: unknown }) => {
      expect(args.where).toEqual({
        id: STANDALONE_ID,
        ...buildWorkSpaceParticipationWhere([EMPLOYEE_ID]),
      });
      return { id: STANDALONE_ID };
    });
    const key = workspaceCanonicalKey(STANDALONE_ID);
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue(
      conversationRow('conv-ws', 'WORKSPACE', key),
    );
    const created = await ensureWorkSpaceConversation(
      prisma as never,
      STANDALONE_ID,
      EMPLOYEE_ID,
      TASKS_VIEW_NONE,
    );
    expect(created.type).toBe('WORKSPACE');
    expect(created.canonicalKey).toBe(key);
    expect(prisma.messengerConversation.create).toHaveBeenCalled();
  });
});

describe('Project General laziness', () => {
  it('does not create Project General unless ensureProjectGeneral is called', async () => {
    const prisma = createPrisma();
    prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, name: 'Acme' });
    prisma.project.findUnique.mockResolvedValue({
      id: PROJECT_ID,
      teamMembers: [{ employeeId: EMPLOYEE_ID }],
      products: [],
      extensions: [],
      orders: [],
    });
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue(
      conversationRow('conv-general', 'PROJECT_GENERAL', `project_general:${PROJECT_ID}`),
    );
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    await ensureProjectGeneralConversation(prisma as never, PROJECT_ID, EMPLOYEE_ID);
    expect(prisma.messengerConversation.create).toHaveBeenCalledTimes(1);
  });
});
