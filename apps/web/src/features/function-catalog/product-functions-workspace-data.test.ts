import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadProductFunctionsWorkspace } from './product-functions-workspace-data';

const getByProduct = vi.fn();
const getByExtension = vi.fn();
const listAll = vi.fn();
const getProductById = vi.fn();
const getExtensionById = vi.fn();

vi.mock('@/lib/api/delivery-configurations', () => ({
  deliveryConfigurationsApi: {
    getByProduct: (...args: unknown[]) => getByProduct(...args),
    getByExtension: (...args: unknown[]) => getByExtension(...args),
  },
}));

vi.mock('@/lib/api/delivery-functions', () => ({
  deliveryFunctionsApi: { listAll: (...args: unknown[]) => listAll(...args) },
}));

vi.mock('@/lib/api/products', () => ({
  productsApi: { getById: (...args: unknown[]) => getProductById(...args) },
}));

vi.mock('@/lib/api/extensions', () => ({
  extensionsApi: { getById: (...args: unknown[]) => getExtensionById(...args) },
}));

describe('loadProductFunctionsWorkspace', () => {
  beforeEach(() => {
    getByProduct.mockResolvedValue({ mode: 'V2', id: 'cfg-product' });
    getByExtension.mockResolvedValue({ mode: 'V2', id: 'cfg-extension' });
    listAll.mockResolvedValue([]);
    getProductById.mockResolvedValue({ status: 'DEVELOPMENT' });
    getExtensionById.mockResolvedValue({ status: 'QA' });
  });

  it('loads a product configuration by product id', async () => {
    const loaded = await loadProductFunctionsWorkspace({ kind: 'product', id: 'prod-1' });
    expect(getByProduct).toHaveBeenCalledWith('prod-1');
    expect(getByExtension).not.toHaveBeenCalled();
    expect(getProductById).toHaveBeenCalledWith('prod-1');
    expect(getExtensionById).not.toHaveBeenCalled();
    expect(loaded.config).toEqual({ mode: 'V2', id: 'cfg-product' });
    expect(loaded.deliveryStatus).toBe('DEVELOPMENT');
  });

  it('loads an extension configuration by extension id', async () => {
    const loaded = await loadProductFunctionsWorkspace({ kind: 'extension', id: 'ext-1' });
    expect(getByExtension).toHaveBeenCalledWith('ext-1');
    expect(getByProduct).not.toHaveBeenCalled();
    expect(getExtensionById).toHaveBeenCalledWith('ext-1');
    expect(getProductById).not.toHaveBeenCalled();
    expect(loaded.config).toEqual({ mode: 'V2', id: 'cfg-extension' });
    expect(loaded.deliveryStatus).toBe('QA');
  });
});

describe('product and delivery functions hide sale price', () => {
  it('reuses composition without sale-price labels or a product-id-only load', () => {
    const catalogRoot = path.join(process.cwd(), 'apps/web/src/features/function-catalog');
    const deliveryRoot = path.join(
      process.cwd(),
      'apps/web/src/features/projects/components/delivery-board',
    );
    const workspace = readFileSync(
      path.join(catalogRoot, 'product-functions-workspace.tsx'),
      'utf8',
    );
    const trigger = readFileSync(path.join(catalogRoot, 'add-function-trigger.tsx'), 'utf8');
    const data = readFileSync(
      path.join(catalogRoot, 'product-functions-workspace-data.ts'),
      'utf8',
    );
    const panels = readFileSync(
      path.join(deliveryRoot, 'DeliveryItemDetailSecondaryPanels.tsx'),
      'utf8',
    );
    for (const source of [workspace, trigger, data, panels]) {
      expect(source).not.toContain('salePriceCardLabels');
    }
    expect(workspace).toContain('showSalePrice={false}');
    expect(workspace).toContain('AddFunctionTrigger');
    expect(workspace).toContain('RemoveExtraDialog');
    expect(trigger).toContain('salePriceByFunctionId={new Map()}');
    expect(trigger).toContain('FunctionCatalogSheet');
    expect(data).toContain('getByExtension');
    expect(panels).toContain("kind: 'extension'");
  });
});
