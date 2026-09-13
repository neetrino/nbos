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

describe('App install guide page', () => {
  it('exposes /install and copies catalog URLs instead of an in-app install banner', () => {
    const route = readSource('src/app/(app)/install/page.tsx');
    const page = readSource('src/features/app-install/AppInstallPage.tsx');
    const catalog = readSource('src/features/app-install/app-install-catalog.ts');
    expect(route).toContain("from '@/features/app-install/AppInstallPage'");
    expect(page).toContain('AppInstallAppList');
    expect(page).toContain('AppInstallGuide');
    expect(catalog).toContain("kind: 'mini'");
    expect(catalog).toContain("kind: 'main'");
    expect(catalog.indexOf("kind: 'mini'")).toBeLessThan(catalog.indexOf("kind: 'main'"));
  });

  it('shows Android and iOS install cards side by side', () => {
    const guide = readSource('src/features/app-install/AppInstallGuide.tsx');
    const cards = readSource('src/features/app-install/AppInstallOsCards.tsx');
    expect(guide).toContain('AppInstallOsCards');
    expect(guide).not.toContain('AppInstallMenuArt');
    expect(cards).toContain('AndroidOsMark');
    expect(cards).toContain('IosOsMark');
    expect(cards).toContain('AndroidInstallShot');
    expect(cards).toContain('IosInstallShot');
  });
});
