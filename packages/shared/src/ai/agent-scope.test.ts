import { describe, expect, it } from 'vitest';
import {
  findMatchingScope,
  matchesGrantedScope,
  PLATFORM_ORGANIZATION_SCOPE_ID,
  type AgentGrantedScope,
} from './agent-scope';

const workspaceScope: AgentGrantedScope = { scopeType: 'WORKSPACE', scopeId: 'ws-1' };

describe('matchesGrantedScope', () => {
  it('matches a workspace scope only for that workspace', () => {
    expect(matchesGrantedScope(workspaceScope, { workspaceId: 'ws-1' })).toBe(true);
    expect(matchesGrantedScope(workspaceScope, { workspaceId: 'ws-2' })).toBe(false);
  });

  it('denies when the target carries no workspace at all', () => {
    expect(matchesGrantedScope(workspaceScope, {})).toBe(false);
    expect(matchesGrantedScope(workspaceScope, { workspaceId: null })).toBe(false);
    expect(matchesGrantedScope(workspaceScope, { workspaceId: '' })).toBe(false);
  });

  it('does not let a product scope authorize an unrelated workspace', () => {
    const productScope: AgentGrantedScope = { scopeType: 'PRODUCT', scopeId: 'prod-1' };
    expect(matchesGrantedScope(productScope, { productId: 'prod-1', workspaceId: 'ws-9' })).toBe(
      true,
    );
    expect(matchesGrantedScope(productScope, { productId: 'prod-2', workspaceId: 'ws-9' })).toBe(
      false,
    );
    expect(matchesGrantedScope(productScope, { workspaceId: 'prod-1' })).toBe(false);
  });

  it('matches project scope only on projectId', () => {
    const projectScope: AgentGrantedScope = { scopeType: 'PROJECT', scopeId: 'proj-1' };
    expect(matchesGrantedScope(projectScope, { projectId: 'proj-1' })).toBe(true);
    expect(matchesGrantedScope(projectScope, { productId: 'proj-1' })).toBe(false);
  });

  it('matches organization scope only with the platform sentinel', () => {
    const orgScope: AgentGrantedScope = {
      scopeType: 'ORGANIZATION',
      scopeId: PLATFORM_ORGANIZATION_SCOPE_ID,
    };
    expect(matchesGrantedScope(orgScope, { workspaceId: 'any' })).toBe(true);
    expect(
      matchesGrantedScope(
        { scopeType: 'ORGANIZATION', scopeId: 'spoofed' },
        { workspaceId: 'any' },
      ),
    ).toBe(false);
  });

  it('requires both resourceType and id for resource scope', () => {
    const resourceScope: AgentGrantedScope = {
      scopeType: 'RESOURCE',
      scopeId: 'task-1',
      resourceType: 'TASK',
    };
    expect(matchesGrantedScope(resourceScope, { resourceType: 'TASK', resourceId: 'task-1' })).toBe(
      true,
    );
    expect(matchesGrantedScope(resourceScope, { resourceType: 'FILE', resourceId: 'task-1' })).toBe(
      false,
    );
    expect(matchesGrantedScope(resourceScope, { resourceId: 'task-1' })).toBe(false);
    expect(
      matchesGrantedScope(
        { scopeType: 'RESOURCE', scopeId: 'task-1' },
        { resourceType: 'TASK', resourceId: 'task-1' },
      ),
    ).toBe(false);
  });

  it('denies an empty scope id', () => {
    expect(matchesGrantedScope({ scopeType: 'WORKSPACE', scopeId: '' }, { workspaceId: '' })).toBe(
      false,
    );
  });
});

describe('findMatchingScope', () => {
  it('ignores scope types the capability does not allow', () => {
    const scopes: AgentGrantedScope[] = [
      { scopeType: 'RESOURCE', scopeId: 'task-1', resourceType: 'TASK' },
    ];
    expect(
      findMatchingScope(scopes, { resourceType: 'TASK', resourceId: 'task-1' }, ['WORKSPACE']),
    ).toBeNull();
    expect(
      findMatchingScope(scopes, { resourceType: 'TASK', resourceId: 'task-1' }, ['RESOURCE']),
    ).toEqual(scopes[0]);
  });

  it('returns null when the agent holds no scopes', () => {
    expect(findMatchingScope([], { workspaceId: 'ws-1' }, ['WORKSPACE'])).toBeNull();
  });

  it('does not let an unrelated workspace grant authorize another workspace', () => {
    const scopes: AgentGrantedScope[] = [
      { scopeType: 'WORKSPACE', scopeId: 'ws-allowed' },
      { scopeType: 'WORKSPACE', scopeId: 'ws-other' },
    ];
    expect(findMatchingScope(scopes, { workspaceId: 'ws-forbidden' }, ['WORKSPACE'])).toBeNull();
    expect(findMatchingScope(scopes, { workspaceId: 'ws-other' }, ['WORKSPACE'])).toEqual(
      scopes[1],
    );
  });
});
