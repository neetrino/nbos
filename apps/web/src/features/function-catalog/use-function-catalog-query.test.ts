import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('useFunctionCatalogQuery', () => {
  it('fetches function prices only through loadCatalogUnitsIfPermitted', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'apps/web/src/features/function-catalog/use-function-catalog-query.ts',
      ),
      'utf8',
    );
    expect(source).toContain("can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE)");
    expect(source).toContain('loadCatalogUnitsIfPermitted(canSeeRules');
    expect(source).toContain('deliveryNormsApi.listFunctionPrices');
    expect(source).toContain('deliveryCatalogStructureApi.listSalePrices');
    expect(source).not.toContain('listRoleRates');
    expect(source).not.toContain('loadDeveloperRateIfPermitted');
  });
});
