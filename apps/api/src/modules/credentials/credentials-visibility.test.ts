import { describe, expect, it } from 'vitest';
import {
  buildCredentialVisibilityOr,
  credentialVisibilityContextFromTeam,
} from './credentials-visibility';

function unwrapAnd(branch: Record<string, unknown>): Record<string, unknown> {
  const and = branch.AND;
  if (!Array.isArray(and) || and.length === 0) return branch;
  const first = and[0];
  return first && typeof first === 'object' ? (first as Record<string, unknown>) : branch;
}

describe('buildCredentialVisibilityOr', () => {
  const ctx = credentialVisibilityContextFromTeam(
    'emp-1',
    ['dept-1'],
    { projectIds: ['proj-1'], productIds: ['prod-a'], projectAdminProjectIds: [] },
    ['cred-secret-1'],
  );

  it('includes team-scoped PROJECT_TEAM rules', () => {
    const branches = buildCredentialVisibilityOr(ctx);
    const projectTeam = branches.map(unwrapAnd).find((b) => b.accessLevel === 'PROJECT_TEAM');
    expect(projectTeam).toBeDefined();
    expect(projectTeam?.OR).toEqual(
      expect.arrayContaining([
        { productId: { in: ['prod-a'] } },
        { projectId: { in: ['proj-1'] }, productId: null },
      ]),
    );
  });

  it('includes manual grants without OWNER_ONLY', () => {
    const branches = buildCredentialVisibilityOr(ctx);
    const grant = branches.find((b) => 'confidentiality' in b);
    expect(grant).toMatchObject({ confidentiality: { not: 'OWNER_ONLY' } });
  });

  it('lets CEO see all NORMAL project credentials without membership', () => {
    const ceo = credentialVisibilityContextFromTeam(
      'ceo-1',
      [],
      { projectIds: [], productIds: [], projectAdminProjectIds: [] },
      [],
      true,
    );
    const branches = buildCredentialVisibilityOr(ceo).map(unwrapAnd);
    expect(branches).toEqual(
      expect.arrayContaining([expect.objectContaining({ accessLevel: 'PROJECT_TEAM' })]),
    );
    const personal = branches.find((b) => b.accessLevel === 'PERSONAL');
    expect(personal).toMatchObject({ ownerId: 'ceo-1' });
  });

  it('never opens OWNER_ONLY via grants', () => {
    const ceo = credentialVisibilityContextFromTeam(
      'ceo-1',
      [],
      { projectIds: [], productIds: [], projectAdminProjectIds: [] },
      ['owner-only-cred'],
      true,
    );
    const grant = buildCredentialVisibilityOr(ceo).find((b) => 'confidentiality' in b);
    expect(grant).toMatchObject({ confidentiality: { not: 'OWNER_ONLY' } });
  });
});
