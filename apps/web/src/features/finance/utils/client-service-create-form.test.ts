import { describe, expect, it } from 'vitest';
import {
  applyProductToClientServiceForm,
  canSubmitClientServiceCreate,
  clientServiceNamePlaceholder,
} from './client-service-create-form';
import { EMPTY_CLIENT_SERVICE_FORM } from './client-service-form-state';

describe('clientServiceNamePlaceholder', () => {
  it('returns a type-specific name hint', () => {
    expect(clientServiceNamePlaceholder('DOMAIN')).toBe('example.com');
    expect(clientServiceNamePlaceholder('SERVICE')).toBe('Google Workspace');
    expect(clientServiceNamePlaceholder('OTHER')).toBe('Service name');
  });
});

describe('applyProductToClientServiceForm', () => {
  it('sets product and owning project together', () => {
    const next = applyProductToClientServiceForm(EMPTY_CLIENT_SERVICE_FORM, {
      id: 'product-1',
      projectId: 'project-1',
    });
    expect(next.productId).toBe('product-1');
    expect(next.projectId).toBe('project-1');
  });
});

describe('canSubmitClientServiceCreate', () => {
  it('requires product, project, and name', () => {
    expect(canSubmitClientServiceCreate(EMPTY_CLIENT_SERVICE_FORM)).toBe(false);
    expect(
      canSubmitClientServiceCreate({
        ...EMPTY_CLIENT_SERVICE_FORM,
        productId: 'product-1',
        projectId: 'project-1',
        name: 'example.com',
      }),
    ).toBe(true);
  });

  it('rejects invalid money strings', () => {
    expect(
      canSubmitClientServiceCreate({
        ...EMPTY_CLIENT_SERVICE_FORM,
        productId: 'product-1',
        projectId: 'project-1',
        name: 'example.com',
        ourCost: 'abc',
      }),
    ).toBe(false);
  });
});
