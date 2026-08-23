import { beforeEach, describe, expect, it } from 'vitest';
import { findMatchingScope, getAiCapability, PLATFORM_ORGANIZATION_SCOPE_ID } from '@nbos/shared';
import type { AgentGrantedScope, AiResourceTarget } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { toScopedAgentTaskLinks } from './agent-task-links.scope';

const WORKSPACE = {
  id: 'ws-a',
  name: 'Alpha',
  type: 'STANDALONE_OPERATIONAL' as const,
  projectId: 'proj-a',
  productId: 'prod-a',
  extensionId: null,
  scrumEnabled: false,
};

const LINKS = [
  { entityType: 'PROJECT', entityId: 'proj-a' },
  { entityType: 'PRODUCT', entityId: 'prod-a' },
  { entityType: 'WORKSPACE', entityId: 'ws-a' },
  { entityType: 'TASK', entityId: 'task-a' },
  { entityType: 'TASK', entityId: 'task-b' },
  { entityType: 'TASK', entityId: 'task-other-ws' },
  { entityType: 'TASK', entityId: 'missing-task' },
  { entityType: 'INVOICE', entityId: 'inv-1' },
];

const READ_LINKS = getAiCapability('tasks.read_links');

function allowFor(scopes: AgentGrantedScope[]) {
  return async (target: AiResourceTarget): Promise<boolean> =>
    Boolean(findMatchingScope(scopes, target, READ_LINKS?.allowedScopeTypes ?? []));
}

describe('toScopedAgentTaskLinks', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.workSpace.findUnique.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(
        where.id === 'ws-a'
          ? WORKSPACE
          : where.id === 'ws-b'
            ? { ...WORKSPACE, id: 'ws-b', projectId: 'proj-b', productId: 'prod-b' }
            : null,
      ),
    );
    prisma.task.findFirst.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === 'task-a' || where.id === 'task-b') {
        return Promise.resolve({ id: where.id, workspaceId: 'ws-a' });
      }
      if (where.id === 'task-other-ws') {
        return Promise.resolve({ id: where.id, workspaceId: 'ws-b' });
      }
      return Promise.resolve(null);
    });
  });

  it('omits same-workspace Task B when the agent only has RESOURCE(Task A)', async () => {
    const links = await toScopedAgentTaskLinks(
      prisma as never,
      WORKSPACE,
      LINKS,
      allowFor([{ scopeType: 'RESOURCE', scopeId: 'task-a', resourceType: 'TASK' }]),
    );
    expect(links.map((link) => `${link.entityType}:${link.entityId}`)).toEqual(['TASK:task-a']);
  });

  it('returns same-workspace Task B for WORKSPACE, PROJECT and ORGANIZATION scopes', async () => {
    const workspaceLinks = await toScopedAgentTaskLinks(
      prisma as never,
      WORKSPACE,
      LINKS,
      allowFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-a' }]),
    );
    const productLinks = await toScopedAgentTaskLinks(
      prisma as never,
      WORKSPACE,
      LINKS,
      allowFor([{ scopeType: 'PRODUCT', scopeId: 'prod-a' }]),
    );
    const projectLinks = await toScopedAgentTaskLinks(
      prisma as never,
      WORKSPACE,
      LINKS,
      allowFor([{ scopeType: 'PROJECT', scopeId: 'proj-a' }]),
    );
    const orgLinks = await toScopedAgentTaskLinks(
      prisma as never,
      WORKSPACE,
      LINKS,
      allowFor([{ scopeType: 'ORGANIZATION', scopeId: PLATFORM_ORGANIZATION_SCOPE_ID }]),
    );

    expect(workspaceLinks.map((link) => `${link.entityType}:${link.entityId}`)).toEqual([
      'PROJECT:proj-a',
      'PRODUCT:prod-a',
      'WORKSPACE:ws-a',
      'TASK:task-a',
      'TASK:task-b',
    ]);
    expect(projectLinks.map((link) => `${link.entityType}:${link.entityId}`)).toEqual(
      workspaceLinks.map((link) => `${link.entityType}:${link.entityId}`),
    );
    expect(productLinks.map((link) => `${link.entityType}:${link.entityId}`)).toEqual(
      workspaceLinks.map((link) => `${link.entityType}:${link.entityId}`),
    );
    expect(orgLinks.map((link) => `${link.entityType}:${link.entityId}`)).toEqual([
      'PROJECT:proj-a',
      'PRODUCT:prod-a',
      'WORKSPACE:ws-a',
      'TASK:task-a',
      'TASK:task-b',
      'TASK:task-other-ws',
    ]);
  });

  it('omits a missing task the same way as an out-of-scope task', async () => {
    const links = await toScopedAgentTaskLinks(
      prisma as never,
      WORKSPACE,
      [{ entityType: 'TASK', entityId: 'missing-task' }],
      allowFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-a' }]),
    );
    expect(links).toEqual([]);
  });
});
