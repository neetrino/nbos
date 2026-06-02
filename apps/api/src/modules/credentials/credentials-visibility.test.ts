import { describe, expect, it } from 'vitest';
import {
  buildCredentialVisibilityOr,
  credentialVisibilityContextFromTeam,
} from './credentials-visibility';

describe('buildCredentialVisibilityOr', () => {
  const ctx = credentialVisibilityContextFromTeam(
    'emp-1',
    ['dept-1'],
    { projectIds: ['proj-1'], productIds: ['prod-a'], projectAdminProjectIds: [] },
    ['cred-secret-1'],
  );

  it('includes team-scoped PROJECT_TEAM rules', () => {
    const branches = buildCredentialVisibilityOr(ctx);
    const projectTeam = branches.find(
      (b) => 'accessLevel' in b && b.accessLevel === 'PROJECT_TEAM',
    );
    expect(projectTeam).toBeDefined();
    expect(projectTeam?.OR).toEqual(
      expect.arrayContaining([
        { productId: { in: ['prod-a'] } },
        { projectId: { in: ['proj-1'] }, productId: null },
      ]),
    );
  });

  it('includes manual grants for SECRET', () => {
    const branches = buildCredentialVisibilityOr(ctx);
    const secret = branches.find((b) => 'accessLevel' in b && b.accessLevel === 'SECRET');
    expect(secret?.OR).toEqual(
      expect.arrayContaining([
        { allowedEmployees: { has: 'emp-1' } },
        { id: { in: ['cred-secret-1'] } },
      ]),
    );
  });
});
