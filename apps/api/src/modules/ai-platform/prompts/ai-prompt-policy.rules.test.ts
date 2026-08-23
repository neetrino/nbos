import { describe, expect, it } from 'vitest';
import { canonicalizePromptLayers } from '@nbos/shared';
import { digestPromptLayers, requirePromptLayers } from './ai-prompt-policy.rules';

describe('ai-prompt-policy.rules', () => {
  it('digests canonical layers without depending on key insertion order', () => {
    const left = digestPromptLayers({
      channelBehavior: 'short',
      agentRole: 'Helper',
      platformSafety: 'Deny by default',
    });
    const right = digestPromptLayers({
      platformSafety: 'Deny by default',
      agentRole: 'Helper',
      channelBehavior: 'short',
    });
    expect(left).toBe(right);
    expect(left).toHaveLength(64);
    expect(
      canonicalizePromptLayers({ platformSafety: 'Deny by default', agentRole: 'Helper' }),
    ).toContain('platformSafety');
  });

  it('rejects empty platform safety', () => {
    expect(() => requirePromptLayers({ platformSafety: '  ', agentRole: 'Helper' })).toThrow(
      /platformSafety/,
    );
  });
});
