import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_TEST_BASE_UNITS,
  SYNTHETIC_TEST_RATES,
} from '../../../../../packages/shared/src/delivery-compensation/synthetic-test-fixtures';
import { inspectV2DevelopmentReadiness } from './inspect-v2-development-readiness';

const assignees = {
  BACKEND: 'emp-be',
  FRONTEND: 'emp-fe',
  PM: 'emp-pm',
  DESIGNER: 'emp-de',
  QA: 'emp-qa',
  TECHNICAL_SPECIALIST: 'emp-ts',
};

const normatives = {
  designMode: 'FULL_DESIGN' as const,
  aiDesignerReview: false,
  baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS,
  rates: SYNTHETIC_TEST_RATES,
  features: [],
};

describe('inspectV2DevelopmentReadiness', () => {
  it('skips implicit legacy cards without creating a plan', () => {
    const result = inspectV2DevelopmentReadiness({
      mode: null,
      initialRevisionId: null,
      checkedAt: new Date(),
      assignees,
      normatives,
    });
    expect(result).toEqual({ apply: false, reason: 'LEGACY_OR_ABSENT' });
  });

  it('does not rematerialize when the initial revision already exists', () => {
    const result = inspectV2DevelopmentReadiness({
      mode: 'V2',
      initialRevisionId: 'rev-1',
      checkedAt: new Date(),
      assignees,
      normatives,
    });
    expect(result).toEqual({ apply: false, reason: 'ALREADY_MATERIALIZED' });
  });

  it('blocks Development when a required role is unassigned, without amounts', () => {
    const result = inspectV2DevelopmentReadiness({
      mode: 'V2',
      initialRevisionId: null,
      checkedAt: new Date(),
      assignees: { ...assignees, BACKEND: undefined },
      normatives,
    });
    expect(result.apply).toBe(true);
    if (!result.apply) return;
    expect(result.errors).toContain('ROLE_ASSIGNMENT_REQUIRED');
    expect(JSON.stringify(result.errors)).not.toMatch(/\d{2,}/);
  });

  it('does not block Development on a missing AI reviewer', () => {
    const result = inspectV2DevelopmentReadiness({
      mode: 'V2',
      initialRevisionId: null,
      checkedAt: new Date(),
      assignees,
      normatives: { ...normatives, designMode: 'AI_DESIGN', aiDesignerReview: false },
    });
    expect(result.apply).toBe(true);
    if (!result.apply) return;
    expect(result.errors).not.toContain('AI_DESIGNER_REVIEW_REQUIRED');
  });
});
