import { describe, expect, it } from 'vitest';
import {
  collectBoundCredentialIds,
  findBoundCredential,
  mapBoundSlotCredentialToListItem,
} from './product-credential-mappers';
import type { ProductAccessSlotsResponse } from '@/lib/api/products';

const SLOTS: ProductAccessSlotsResponse = {
  productId: 'prod-1',
  slots: [
    {
      slotKey: 'HOSTING',
      label: 'Hosting account',
      required: true,
      kind: 'credential',
      allowedCategories: ['HOSTING'],
      defaultCredentialType: 'HOSTING_SERVER',
      bindings: [
        {
          bindingId: 'bind-1',
          boundCredential: {
            id: 'cred-shared',
            name: 'Beget company',
            category: 'HOSTING',
            credentialType: 'HOSTING_SERVER',
            login: null,
            url: null,
            canReveal: false,
          },
        },
      ],
    },
  ],
};

describe('product credential mappers', () => {
  it('collects bound ids from slots', () => {
    expect(collectBoundCredentialIds(SLOTS)).toEqual(['cred-shared']);
  });

  it('maps a restricted slot binding without login', () => {
    const bound = findBoundCredential(SLOTS, 'cred-shared');
    expect(bound).not.toBeNull();
    const item = mapBoundSlotCredentialToListItem(bound!);
    expect(item.name).toBe('Beget company');
    expect(item.login).toBeNull();
    expect(item.accessLevel).toBe('SECRET');
  });
});
