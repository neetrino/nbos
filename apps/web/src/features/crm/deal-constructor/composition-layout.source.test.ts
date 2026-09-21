import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('composition and catalog layout', () => {
  it('keeps collections in the catalog and the total at the bottom', () => {
    const dealRoot = path.join(process.cwd(), 'apps/web/src/features/crm/deal-constructor');
    const catalogRoot = path.join(process.cwd(), 'apps/web/src/features/function-catalog');
    const panel = readFileSync(path.join(dealRoot, 'product-composition-panel.tsx'), 'utf8');
    const sheet = readFileSync(path.join(dealRoot, 'product-composition-sheet.tsx'), 'utf8');
    const totals = readFileSync(path.join(dealRoot, 'DealConstructorTotals.tsx'), 'utf8');
    const catalog = readFileSync(path.join(catalogRoot, 'function-catalog-sheet.tsx'), 'utf8');
    const browser = readFileSync(path.join(catalogRoot, 'function-catalog-browser.tsx'), 'utf8');
    const chips = readFileSync(path.join(catalogRoot, 'function-catalog-collections.tsx'), 'utf8');
    expect(panel).not.toContain('FunctionCatalogCollections');
    expect(panel).not.toContain('onApplyCollection');
    expect(panel).toContain('justify-between');
    expect(sheet).toContain('width="medium"');
    expect(totals).toContain('justify-end');
    expect(totals).not.toContain('amountHint');
    expect(catalog).toContain('FunctionCatalogCollections');
    expect(catalog).toContain('stackAboveEntitySheet');
    expect(browser).toContain('belowSearch');
    expect(chips).toContain('FUNCTION_CATALOG_COLLECTION_CHIP_CLASS');
  });
});
