import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('FunctionPricingPanel', () => {
  it('does not fetch rules unless DELIVERY_COMPENSATION_RULES VIEW is granted', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'apps/web/src/features/function-catalog/function-pricing-panel.tsx'),
      'utf8',
    );
    expect(source).toContain("can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE)");
    expect(source).toContain('if (!canSeeRules)');
    expect(source).toContain('listFunctionPrices');
  });
});
