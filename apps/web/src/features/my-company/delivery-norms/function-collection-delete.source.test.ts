import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('function collection delete', () => {
  it('exposes delete on the API and the collections tab', () => {
    const apiRoot = path.join(process.cwd(), 'apps/api/src/modules/delivery-compensation');
    const webRoot = path.join(process.cwd(), 'apps/web/src/features/my-company/delivery-norms');
    const client = readFileSync(
      path.join(process.cwd(), 'apps/web/src/lib/api/delivery-catalog-structure.ts'),
      'utf8',
    );
    const controller = readFileSync(path.join(apiRoot, 'catalog-structure.controller.ts'), 'utf8');
    const editor = readFileSync(path.join(webRoot, 'function-collection-editor.tsx'), 'utf8');
    const kind = readFileSync(path.join(webRoot, 'function-collection-kind-editor.tsx'), 'utf8');
    expect(controller).toContain("@Delete('collections/:id')");
    expect(client).toContain('deleteCollection');
    expect(editor).toContain('onDelete');
    expect(kind).toContain('FunctionCollectionDeleteDialog');
  });
});
