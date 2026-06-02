import { describe, expect, it } from 'vitest';
import { buildCredentialFormSnap } from './credential-form-sheet-snapshot';

describe('buildCredentialFormSnap', () => {
  it('treats identical fields as same snapshot', () => {
    const fields = {
      name: ' Acme ',
      category: 'SERVICE',
      credentialType: 'LOGIN_PASSWORD',
      comment: 'note',
      environment: '',
      provider: '',
      url: '',
      login: '',
      phone: '',
      criticality: 'MEDIUM',
      nextRotationAt: '',
      manualGrants: [],
    };
    expect(buildCredentialFormSnap(fields)).toBe(
      buildCredentialFormSnap({ ...fields, name: 'Acme' }),
    );
  });

  it('includes manual grants in snapshot', () => {
    const base = buildCredentialFormSnap({
      name: 'x',
      category: 'SERVICE',
      credentialType: 'LOGIN_PASSWORD',
      comment: '',
      environment: '',
      provider: '',
      url: '',
      login: '',
      phone: '',
      criticality: 'MEDIUM',
      nextRotationAt: '',
      manualGrants: [],
    });
    const withGrant = buildCredentialFormSnap({
      name: 'x',
      category: 'SERVICE',
      credentialType: 'LOGIN_PASSWORD',
      comment: '',
      environment: '',
      provider: '',
      url: '',
      login: '',
      phone: '',
      criticality: 'MEDIUM',
      nextRotationAt: '',
      manualGrants: [
        {
          employeeId: 'e1',
          level: 'VIEW',
          expiresAt: null,
          employee: { id: 'e1', firstName: 'A', lastName: 'B', email: '' },
          grantedAt: '2026-01-01',
          grantedBy: null,
        },
      ],
    });
    expect(base).not.toBe(withGrant);
  });
});
