import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AI_CAPABILITIES_FORBIDDEN_PHASE_1, listAiCapabilities } from '@nbos/shared';
import { AGENT_OPERATIONS } from '../protocol/agent-operation.registry';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function readModule(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

describe('provider secret isolation from External Agent wire', () => {
  it('registers no provider-key or credentials capability', () => {
    const keys = listAiCapabilities().map((item) => item.key);
    expect(keys.some((key) => key.includes('provider') || key.includes('credential'))).toBe(false);
    expect(AI_CAPABILITIES_FORBIDDEN_PHASE_1).toEqual(
      expect.arrayContaining(['tasks.delete', 'tasks.set_status', 'tasks.force_complete']),
    );
  });

  it('keeps REST and MCP free of the secret store and crypto module', () => {
    const sources = [
      readModule('rest/agent-identity.controller.ts'),
      readModule('rest/agent-tasks.controller.ts'),
      readModule('rest/agent-artifacts.controller.ts'),
      readModule('mcp/agent-mcp.server.ts'),
      readModule('protocol/agent-operation.registry.ts'),
    ];
    for (const source of sources) {
      expect(source).not.toContain('AiProviderSecretStore');
      expect(source).not.toContain('CREDENTIALS_ENCRYPTION_KEY');
      expect(source).not.toContain('encryptedApiKey');
    }
    expect(
      Object.values(AGENT_OPERATIONS).every(
        (operation) => !operation.capabilityKey?.includes('provider'),
      ),
    ).toBe(true);
  });
});
