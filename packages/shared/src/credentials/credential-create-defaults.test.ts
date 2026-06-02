import { describe, expect, it } from 'vitest';
import { resolveCredentialCreateDefaults } from './credential-create-defaults';

describe('resolveCredentialCreateDefaults', () => {
  it('assigns CRITICAL for SSH keys', () => {
    const d = resolveCredentialCreateDefaults({
      credentialType: 'SSH_PRIVATE_KEY',
      accessLevel: 'PROJECT_TEAM',
    });
    expect(d.criticality).toBe('CRITICAL');
  });

  it('raises criticality floor for SECRET scope', () => {
    const d = resolveCredentialCreateDefaults({
      credentialType: 'LOGIN_PASSWORD',
      accessLevel: 'SECRET',
    });
    expect(d.criticality).toBe('HIGH');
  });

  it('returns ISO nextRotationAt', () => {
    const d = resolveCredentialCreateDefaults({
      credentialType: 'API_KEY',
      accessLevel: 'PROJECT_TEAM',
    });
    expect(() => new Date(d.nextRotationAt)).not.toThrow();
  });
});
