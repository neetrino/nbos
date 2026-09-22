import { describe, expect, it } from 'vitest';
import { productTypesOfferedForNewProduct } from '@nbos/shared';
import {
  CORE_KIND_GROUP_IDS,
  CORE_RAIL_ALL_ID,
  buildCoreRailEntries,
  coreKindGroupId,
  visibleCoreGroupIds,
} from './core-kind-groups';

describe('coreKindGroupId', () => {
  it('puts every offered kind in exactly one family', () => {
    const types = productTypesOfferedForNewProduct();
    const groups = types.map((type) => coreKindGroupId(type));
    expect(groups.every((group) => CORE_KIND_GROUP_IDS.includes(group))).toBe(true);
    const rail = buildCoreRailEntries(types);
    const summed = rail
      .filter((entry) => entry.id !== CORE_RAIL_ALL_ID)
      .reduce((total, entry) => total + entry.count, 0);
    expect(rail.find((entry) => entry.id === CORE_RAIL_ALL_ID)?.count).toBe(types.length);
    expect(summed).toBe(types.length);
    expect(coreKindGroupId('COMPANY_WEBSITE')).toBe('sites');
    expect(coreKindGroupId('ECOMMERCE')).toBe('commerce');
    expect(coreKindGroupId('CRM')).toBe('operations');
    expect(coreKindGroupId('WEB_APP')).toBe('portals');
    expect(coreKindGroupId('LOGO')).toBe('marketing');
    expect(coreKindGroupId('OTHER')).toBe('other');
  });

  it('keeps a selected family only when that family still has kinds', () => {
    expect(visibleCoreGroupIds(['ECOMMERCE', 'LOGO'], 'commerce')).toEqual(['commerce']);
    expect(visibleCoreGroupIds(['LOGO'], 'commerce')).toEqual([]);
    expect(visibleCoreGroupIds(['ECOMMERCE', 'LOGO'], CORE_RAIL_ALL_ID)).toEqual([
      'commerce',
      'marketing',
    ]);
  });
});
