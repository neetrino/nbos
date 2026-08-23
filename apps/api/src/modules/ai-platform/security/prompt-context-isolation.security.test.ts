import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AiPolicyRequest } from '@nbos/shared';

const AI_PLATFORM_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function readSource(relativePath: string): string {
  return readFileSync(join(AI_PLATFORM_ROOT, relativePath), 'utf8');
}

describe('Prompt and context isolation (AD 480, AE 483/495)', () => {
  it('prompt policy service never writes capability or scope grants', () => {
    const source = readSource('prompts/ai-prompt-policy.service.ts');
    expect(source).not.toContain('internalAiAgentCapabilityGrant');
    expect(source).not.toContain('internalAiAgentResourceScope');
    expect(source).not.toContain('externalAgentCapabilityGrant');
    expect(source).not.toContain('externalAgentResourceScope');
    expect(source).not.toContain('ResourceAccessGrant');
  });

  it('policy requests have no prompt or retrieved-content fields', () => {
    const keys: Array<keyof AiPolicyRequest> = [
      'actor',
      'capabilityKey',
      'capability',
      'agentState',
      'credentialState',
      'grant',
      'scopes',
      'target',
      'targetDataClassification',
      'restrictedModules',
      'maxRiskClass',
      'rateLimitExceeded',
      'approvalGranted',
    ];
    expect(keys).not.toContain('prompt');
    expect(keys).not.toContain('layers');
    expect(keys).not.toContain('content');
    expect(keys).not.toContain('query');
    expect(keys).not.toContain('fragments');
  });

  it('knowledge retrieve requires a policy decision argument', () => {
    const source = readSource('context/ai-knowledge.service.ts');
    expect(source).toContain('authorization');
    expect(source).toContain('AiKnowledgeRetrieveRequest');
    expect(source).not.toContain('retrieveWithoutAuth');
    expect(source).not.toContain('pgvector');
    expect(source).not.toContain('embedding');
  });
});
