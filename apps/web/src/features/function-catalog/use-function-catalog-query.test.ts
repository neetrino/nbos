import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('useFunctionCatalogQuery', () => {
  it('fetches function prices only through loadCatalogUnitsIfPermitted', () => {
    const root = path.join(process.cwd(), 'apps/web/src/features/function-catalog');
    const hook = readFileSync(path.join(root, 'use-function-catalog-query.ts'), 'utf8');
    const loader = readFileSync(path.join(root, 'load-function-catalog-query.ts'), 'utf8');
    expect(hook).toContain("can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE)");
    expect(loader).toContain('loadCatalogUnitsIfPermitted(canSeeRules');
    expect(loader).toContain('deliveryNormsApi.listFunctionPrices');
    expect(loader).toContain('deliveryCatalogStructureApi.listSalePrices');
    expect(hook + loader).not.toContain('listRoleRates');
    expect(hook + loader).not.toContain('loadDeveloperRateIfPermitted');
  });
});
