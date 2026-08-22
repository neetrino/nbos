import { describe, expect, it } from 'vitest';
import {
  canonicalizePromptLayers,
  normalizePromptLayers,
  validatePromptLayers,
} from './prompt-layers';
import { PROMPT_LAYER_MAX_CHARS } from './prompt-policy-types';

describe('prompt layers', () => {
  it('requires platform safety and agent role', () => {
    expect(validatePromptLayers({ platformSafety: '  ', agentRole: 'Delivery assistant' })).toBe(
      'PLATFORM_SAFETY_REQUIRED',
    );
    expect(validatePromptLayers({ platformSafety: 'Stay in policy', agentRole: '' })).toBe(
      'AGENT_ROLE_REQUIRED',
    );
  });

  it('rejects oversized layers', () => {
    expect(
      validatePromptLayers({
        platformSafety: 'x'.repeat(PROMPT_LAYER_MAX_CHARS + 1),
        agentRole: 'role',
      }),
    ).toBe('LAYER_TOO_LONG');
  });

  it('canonicalizes layers in a stable order without extra keys', () => {
    const canonical = canonicalizePromptLayers({
      channelBehavior: ' concise ',
      domainRules: ' tasks only ',
      agentRole: ' Delivery ',
      platformSafety: ' Deny by default ',
    });
    expect(canonical).toBe(
      JSON.stringify({
        platformSafety: 'Deny by default',
        agentRole: 'Delivery',
        domainRules: 'tasks only',
        channelBehavior: 'concise',
      }),
    );
    expect(
      normalizePromptLayers({ platformSafety: 'A', agentRole: 'B', domainRules: '  ' }),
    ).toEqual({
      platformSafety: 'A',
      agentRole: 'B',
      domainRules: null,
      channelBehavior: null,
    });
  });
});
