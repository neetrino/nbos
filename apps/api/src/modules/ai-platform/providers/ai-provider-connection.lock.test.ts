import { describe, expect, it } from 'vitest';
import {
  providerConfigChanged,
  toProviderConfigRevision,
  validationRelevantFieldsChanged,
} from './ai-provider-connection.lock';

const base = {
  provider: 'OPENAI' as const,
  baseUrl: null,
  providerOrganizationId: 'org-a',
  providerProjectId: 'proj-a',
};

describe('provider config revision', () => {
  it('treats organization or project changes as a different revision', () => {
    const left = toProviderConfigRevision(base, 'cipher-a');
    expect(
      providerConfigChanged(
        left,
        toProviderConfigRevision({ ...base, providerOrganizationId: 'org-b' }, 'cipher-a'),
      ),
    ).toBe(true);
    expect(
      providerConfigChanged(
        left,
        toProviderConfigRevision({ ...base, providerProjectId: 'proj-b' }, 'cipher-a'),
      ),
    ).toBe(true);
    expect(providerConfigChanged(left, toProviderConfigRevision(base, 'cipher-a'))).toBe(false);
  });

  it('clears validation when organization, project, or baseUrl change', () => {
    expect(
      validationRelevantFieldsChanged(base, {
        baseUrl: null,
        providerOrganizationId: 'org-a',
        providerProjectId: 'proj-a',
      }),
    ).toBe(false);
    expect(
      validationRelevantFieldsChanged(base, {
        baseUrl: 'https://api.example.test',
        providerOrganizationId: 'org-a',
        providerProjectId: 'proj-a',
      }),
    ).toBe(true);
  });
});
