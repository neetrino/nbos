import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('CreateProductDialogFields', () => {
  it('asks for platform before type and does not default WEB on Code', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'apps/web/src/features/projects/components/CreateProductDialogFields.tsx',
      ),
      'utf8',
    );
    expect(source.indexOf('product.fields.platform')).toBeLessThan(
      source.indexOf('product.fields.type'),
    );
    expect(source).toContain('productPlatformPickerApplies');
    expect(source).toContain('productTypeFieldReady');
    expect(source).toContain('keepProductTypeAfterPlatformChange');
  });
});
