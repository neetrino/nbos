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
    expect(panel).toContain('CompositionBaseBoard');
    expect(panel).toContain('baseHeading');
    expect(panel).not.toContain('COMPOSITION_RAIL_GRID_CLASS');
    expect(sheet).toContain('width="wide"');
    expect(totals).toContain('justify-end');
    expect(totals).not.toContain('amountHint');
    expect(catalog).toContain('FunctionCatalogCollections');
    expect(catalog).toContain('DETAIL_SHEET_CONTENT_WIDTH_62VW_CLASS');
    expect(catalog).toContain('FUNCTION_CATALOG_SHEET_CARD_GRID_CLASS');
    expect(catalog).toContain('stackAboveEntitySheet');
    const card = readFileSync(path.join(catalogRoot, 'function-catalog-card.tsx'), 'utf8');
    const section = readFileSync(path.join(dealRoot, 'DealConstructorSection.tsx'), 'utf8');
    const dealCard = readFileSync(path.join(dealRoot, 'deal-composition-card.tsx'), 'utf8');
    expect(card).toContain('FUNCTION_CATALOG_SELECTED_CARD_CLASS');
    expect(card).toContain('catalogCardUsesSelectedSurface(selected)');
    expect(card).not.toContain('selected || alreadyAdded');
    expect(card).toContain('onRemove');
    expect(section).toContain('alreadyAddedIds: selectedIds');
    const deliveryCard = readFileSync(
      path.join(
        process.cwd(),
        'apps/web/src/features/projects/components/delivery-board/delivery-item-composition-section.tsx',
      ),
      'utf8',
    );
    expect(dealCard).toContain('COMPOSITION_DEAL_METRIC_UNITS_CLASS');
    expect(dealCard).toContain('hideMoney');
    expect(dealCard).not.toContain('saleUnknown');
    expect(dealCard).not.toContain('coreTitle');
    expect(deliveryCard).toContain('hideMoney');
    expect(deliveryCard).toContain('ProductFunctionsComposition');
    expect(deliveryCard).toContain('DeliveryCompositionLegacyPanel');
    expect(deliveryCard).toContain('canAdd');
    expect(browser).toContain('belowSearch');
    expect(chips).toContain('FUNCTION_CATALOG_COLLECTION_CHIP_CLASS');
  });
});
