import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));

function readSource(fileName: string): string {
  return readFileSync(join(dir, fileName), 'utf8');
}

describe('Delivery sheet EntityItemHost', () => {
  it('wraps DeliveryItemDetailSheet so the Work Space hub can open a task', () => {
    const panel = readSource('DeliveryItemDetailWorkSpacePanel.tsx');
    expect(panel).toContain('useOpenEntityItemFromSummary');
    expect(panel).not.toContain('EntityItemHost');

    const sheet = readSource('DeliveryItemDetailSheet.tsx');
    expect(sheet).toContain('EntityItemHost');
    expect(sheet).toMatch(/<EntityItemHost[\s\S]*<Sheet/);
    expect(sheet).toContain('productId={headerProps.productId}');
  });
});
