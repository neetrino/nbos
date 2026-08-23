import { describe, expect, it } from 'vitest';
import {
  isDriveConfidentialityForbiddenToAgents,
  mapDriveConfidentialityToAi,
} from './drive-ai-classification';

describe('mapDriveConfidentialityToAi', () => {
  it('maps ordinary Drive files onto INTERNAL', () => {
    expect(mapDriveConfidentialityToAi('PUBLIC_INTERNAL')).toBe('INTERNAL');
    expect(mapDriveConfidentialityToAi('CONFIDENTIAL')).toBe('INTERNAL');
  });

  it('maps finance and legal files onto SENSITIVE', () => {
    expect(mapDriveConfidentialityToAi('FINANCE_SENSITIVE')).toBe('SENSITIVE');
    expect(mapDriveConfidentialityToAi('LEGAL_SENSITIVE')).toBe('SENSITIVE');
  });

  it('blocks SECRET_ADJACENT for agents before the AI ladder is used', () => {
    expect(isDriveConfidentialityForbiddenToAgents('SECRET_ADJACENT')).toBe(true);
    expect(isDriveConfidentialityForbiddenToAgents('CONFIDENTIAL')).toBe(false);
    expect(mapDriveConfidentialityToAi('SECRET_ADJACENT')).toBe('SECRET');
  });

  it('fails closed for unknown Drive values', () => {
    expect(mapDriveConfidentialityToAi('NOT_A_REAL_VALUE')).toBe('SECRET');
  });
});
