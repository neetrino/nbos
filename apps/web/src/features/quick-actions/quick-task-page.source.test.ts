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

  it('does not inherit the main NBOS apple-touch icon on /quick/task', () => {
    const root = readSource('src/app/layout.tsx');
    const app = readSource('src/app/(app)/layout.tsx');
    const quick = readSource('src/app/(quick)/layout.tsx');
    expect(root).toContain('/logo/icon.svg');
    expect(root).not.toContain('apple-touch-icon.png');
    expect(root).not.toContain('/icons/icon-192.png');
    expect(app).toContain('apple-touch-icon.png');
    expect(app).not.toContain('/icons/icon-192.png');
    expect(quick).toContain('quick-task-apple-touch.png');
    expect(quick).not.toContain('/icons/apple-touch-icon.png');
  });

  it('provides HeaderContext so background TasksSurface/PageHero cannot crash the route', () => {
    const layout = readSource('src/app/(quick)/layout.tsx');
    expect(layout).toContain('HeaderContextProvider');
    expect(layout).toContain('PermissionProvider');
  });

  it('keeps the standard mobile Dialog bottom-sheet contract', () => {
    const dialog = readSource('src/components/shared/quick-create-task/QuickCreateTaskDialog.tsx');
    expect(dialog).toContain("from '@/components/ui/dialog'");
    expect(dialog).toContain('<DialogContent');
  });
});
