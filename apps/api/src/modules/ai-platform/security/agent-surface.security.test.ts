import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getAiCapability, isAiCapabilityKey, listAiCapabilities } from '@nbos/shared';
import { TASK_AGENT_UPDATE_ALLOWED_FIELDS } from '../../tasks/task-agent-update.allowlist';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { pickCapabilityInput } from '../gateway/agent-capability.input';
import { toAgentCredentialView } from '../agents/external-agent.mapper';
import { buildInternalAgentExecutionContext } from '../internal-agents/internal-agent-execution';
import { AI_MODEL_STATUS_ON_DISCOVERY } from '../models/ai-model-sync.rules';
import { toProviderConnectionView } from '../providers/ai-provider-connection.mapper';
import { AGENT_OPERATIONS, listAgentOperations } from '../protocol/agent-operation.registry';

const AI_PLATFORM_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Anything an agent must never be able to ask for by name. */
const FORBIDDEN_CAPABILITY_SUBSTRINGS = [
  'sql',
  'query',
  'raw',
  'exec',
  'delete',
  'force',
  'invoice',
  'payment',
  'expense',
  'finance',
  'salary',
  'client_message',
  'message.send',
  'password',
  'secret',
] as const;

const FORBIDDEN_MODULES = ['Finance', 'Credentials', 'Messenger', 'Clients', 'HR'] as const;

const SECRET_FIELD_SUBSTRINGS = ['secret', 'hash', 'token', 'apikey', 'password'] as const;

function readAiPlatformSource(relativePath: string): string {
  return readFileSync(join(AI_PLATFORM_ROOT, relativePath), 'utf8');
}

/**
 * AL 611–612, 619–625: properties of the published External Agent surface that
 * hold regardless of who calls it. These are assertions about the capability
 * catalog, the operation registry and the projections — not a walk-through of
 * one request.
 */
describe('External Agent surface: forbidden capabilities (AL 619-623)', () => {
  it('registers no raw SQL or database capability', () => {
    for (const capability of listAiCapabilities()) {
      for (const forbidden of FORBIDDEN_CAPABILITY_SUBSTRINGS) {
        expect(capability.key.toLowerCase()).not.toContain(forbidden);
      }
    }
    expect(isAiCapabilityKey('database.query')).toBe(false);
    expect(isAiCapabilityKey('db.raw_sql')).toBe(false);
  });

  it('exposes no Task delete operation on either protocol', () => {
    expect(isAiCapabilityKey('tasks.delete')).toBe(false);
    expect(getAiCapability('tasks.delete')).toBeNull();
    for (const operation of listAgentOperations()) {
      expect(operation.restRoute.startsWith('DELETE ')).toBe(false);
      expect(operation.mcpTool).not.toContain('delete');
    }
  });

  it('exposes no force-complete path', () => {
    expect(isAiCapabilityKey('tasks.force_complete')).toBe(false);
    expect(isAiCapabilityKey('tasks.set_status')).toBe(false);
    expect(TASK_AGENT_UPDATE_ALLOWED_FIELDS).not.toContain('status');
    expect(listAgentOperations().map((operation) => operation.mcpTool)).not.toContain(
      'nbos_complete_task',
    );
  });

  it('registers only Tasks and Drive modules, so no Finance or client messaging', () => {
    const modules = new Set(listAiCapabilities().map((capability) => capability.module));
    expect([...modules].sort()).toEqual(['Drive', 'Tasks']);
    for (const forbidden of FORBIDDEN_MODULES) {
      expect(modules.has(forbidden)).toBe(false);
    }
  });

  it('refuses an unknown input field instead of forwarding it to the domain', () => {
    const comment = getAiCapability('tasks.comment');
    expect(comment).not.toBeNull();

    expect(() =>
      pickCapabilityInput(comment!, { taskId: 'task-1', body: 'note', escalate: true }),
    ).toThrow(AgentAccessException);
    expect(() => pickCapabilityInput(comment!, { taskId: 'task-1', body: 'note' })).not.toThrow();
  });

  it('keeps every published operation bound to a registered capability', () => {
    for (const operation of listAgentOperations()) {
      if (!operation.capabilityKey) continue;
      expect(isAiCapabilityKey(operation.capabilityKey)).toBe(true);
    }
  });
});

describe('External Agent surface: secret material (AL 611-612, 625)', () => {
  it('declares no secret-shaped field in any capability output', () => {
    for (const capability of listAiCapabilities()) {
      for (const field of capability.output.fields) {
        for (const forbidden of SECRET_FIELD_SUBSTRINGS) {
          expect(field.toLowerCase()).not.toContain(forbidden);
        }
      }
    }
  });

  it('never projects a credential hash into the admin credential view', () => {
    // A row as it comes back from Prisma, verifier column included.
    const row = {
      id: 'cred-1',
      agentId: 'agent-1',
      keyId: 'aabbccddeeff001122',
      tokenPrefix: 'nbos_agt_aabbccddeeff001122',
      secretHash: '$argon2id$v=19$m=65536,t=3,p=4$must-not-be-projected',
      label: 'CI',
      lastUsedAt: null,
      expiresAt: null,
      rotatedFromId: null,
      revokedAt: null,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    };
    const view = toAgentCredentialView(row, new Date('2026-08-02T00:00:00.000Z'));

    expect(JSON.stringify(view)).not.toContain('argon2id');
    expect(view).not.toHaveProperty('secretHash');
  });

  it('never projects a provider API key into the admin connection view', () => {
    const view = toProviderConnectionView({
      id: 'conn-1',
      provider: 'OPENAI',
      name: 'OpenAI Prod',
      status: 'ACTIVE',
      keyPrefix: 'sk-…2345',
      providerOrganizationId: null,
      providerProjectId: null,
      baseUrl: null,
      lastValidatedAt: null,
      lastModelSyncAt: null,
      createdById: 'emp-1',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    });

    expect(Object.keys(view)).not.toContain('apiKey');
    expect(Object.keys(view)).not.toContain('encryptedApiKey');
  });

  it('builds an Internal Agent execution context without any provider credential', () => {
    const context = buildInternalAgentExecutionContext(
      { id: 'internal-1', name: 'Reporter', status: 'ACTIVE' },
      { surface: 'TASK', correlationId: 'corr-1' },
    );

    const serialized = JSON.stringify(context).toLowerCase();
    for (const forbidden of SECRET_FIELD_SUBSTRINGS) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).not.toContain('sk-');
  });

  it('keeps the provider secret store out of every agent-facing module', () => {
    const agentFacing = [
      'rest/agent-identity.controller.ts',
      'rest/agent-tasks.controller.ts',
      'rest/agent-artifacts.controller.ts',
      'mcp/agent-mcp.server.ts',
      'gateway/agent-capability.gateway.ts',
      'gateway/agent-task-read.handler.ts',
      'gateway/agent-task-write.handler.ts',
      'gateway/agent-drive.handler.ts',
      'gateway/agent-workspace.handler.ts',
      'policy/agent-policy.service.ts',
    ];
    for (const path of agentFacing) {
      const source = readAiPlatformSource(path);
      expect(source).not.toContain('AiProviderSecretStore');
      expect(source).not.toContain('encryptedApiKey');
      expect(source).not.toContain('decryptCipher');
    }
  });
});

describe('External Agent surface: model activation (AL 624)', () => {
  it('lands newly discovered models in DISCOVERED, never ACTIVE', () => {
    expect(AI_MODEL_STATUS_ON_DISCOVERY).toBe('DISCOVERED');
  });

  it('has no agent operation that can activate a model', () => {
    for (const operation of Object.values(AGENT_OPERATIONS)) {
      expect(operation.mcpTool).not.toContain('model');
      expect(operation.restRoute).not.toContain('model');
    }
  });
});
