import { describe, expect, it } from 'vitest';
import {
  canStartInternalAgentExecution,
  INTERNAL_AI_SURFACE_CHANNEL,
  isPhase1ModelPolicyMode,
  isProductionAssignableModelStatus,
} from './index';

describe('AI provider and internal-agent contracts', () => {
  it('never treats DISCOVERED as production-assignable', () => {
    expect(isProductionAssignableModelStatus('DISCOVERED')).toBe(false);
    expect(isProductionAssignableModelStatus('ACTIVE')).toBe(true);
    expect(isProductionAssignableModelStatus('UNAVAILABLE')).toBe(false);
  });

  it('keeps TIERED and ADAPTIVE out of Phase 1 modes', () => {
    expect(isPhase1ModelPolicyMode('FIXED')).toBe(true);
    expect(isPhase1ModelPolicyMode('PRIMARY_FALLBACK')).toBe(true);
    expect(isPhase1ModelPolicyMode('TIERED')).toBe(false);
    expect(isPhase1ModelPolicyMode('ADAPTIVE')).toBe(false);
  });

  it('blocks new Internal Agent execution unless ACTIVE', () => {
    expect(canStartInternalAgentExecution('ACTIVE')).toBe(true);
    expect(canStartInternalAgentExecution('DRAFT')).toBe(false);
    expect(canStartInternalAgentExecution('PAUSED')).toBe(false);
    expect(canStartInternalAgentExecution('DISABLED')).toBe(false);
    expect(canStartInternalAgentExecution('ARCHIVED')).toBe(false);
  });

  it('maps Messenger surface to the messenger channel, not web', () => {
    expect(INTERNAL_AI_SURFACE_CHANNEL.MESSENGER).toBe('messenger');
    expect(INTERNAL_AI_SURFACE_CHANNEL.SCHEDULED).toBe('scheduler');
  });
});
