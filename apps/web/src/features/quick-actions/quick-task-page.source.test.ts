import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  const fromWeb = path.join(process.cwd(), relativePath);
  const fromRoot = path.join(process.cwd(), 'apps/web', relativePath);
  try {
    return readFileSync(fromWeb, 'utf8');
  } catch {
    return readFileSync(fromRoot, 'utf8');
  }
}

describe('Quick Task composition', () => {
  it('reuses the shared QuickCreateTaskDialog and does not fork a quick-only form', () => {
    const page = readSource('src/features/quick-actions/quick-task-page.tsx');
    expect(page).toContain("from '@/components/shared/quick-create-task/QuickCreateTaskDialog'");
    expect(page).not.toMatch(/function QuickCreateTaskForm/);
    expect(page).toContain('hostedCreateDialog={false}');
  });

  it('keeps the standard mobile Dialog bottom-sheet contract', () => {
    const dialog = readSource('src/components/shared/quick-create-task/QuickCreateTaskDialog.tsx');
    expect(dialog).toContain("from '@/components/ui/dialog'");
    expect(dialog).toContain('<DialogContent');
  });
});
