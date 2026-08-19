import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));

function readSource(fileName: string): string {
  return readFileSync(join(dir, fileName), 'utf8');
}

describe('Lead sheet EntityItemHost', () => {
  it('wraps LeadSheet like DealSheet so EntityLinkedTasksTab can open a task', () => {
    const linkedTab = readSource('EntityLinkedTasksTab.tsx');
    expect(linkedTab).toContain('useOpenEntityItemFromSummary');

    const leadSheet = readSource('LeadSheet.tsx');
    expect(leadSheet).toContain('EntityItemHost');
    expect(leadSheet).toMatch(/<EntityItemHost[\s\S]*<Sheet/);

    const dealSheet = readSource('DealSheet.tsx');
    expect(dealSheet).toMatch(/<EntityItemHost[\s\S]*<Sheet/);
  });

  it('does not wrap LeadTasksTab itself — host lives on LeadSheet', () => {
    const leadTasksTab = readSource('LeadTasksTab.tsx');
    expect(leadTasksTab).toContain('EntityLinkedTasksTab');
    expect(leadTasksTab).not.toContain('EntityItemHost');
  });
});
