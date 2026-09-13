import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readPublic(fileName: string): string {
  const fromRoot = path.join(process.cwd(), 'apps/web/public', fileName);
  const fromWeb = path.join(process.cwd(), 'public', fileName);
  try {
    return readFileSync(fromRoot, 'utf8');
  } catch {
    return readFileSync(fromWeb, 'utf8');
  }
}

describe('Quick Task and main PWA manifests', () => {
  it('keeps the main NBOS start URL unchanged', () => {
    const manifest = JSON.parse(readPublic('manifest.webmanifest')) as {
      id: string;
      start_url: string;
    };
    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/');
    expect(JSON.stringify(manifest)).toContain('/icons/icon-192.png?v=wordmark2');
    expect(JSON.stringify(manifest)).not.toContain('/logo/icon.svg');
    expect(JSON.stringify(manifest)).not.toContain('nbos-app.svg');
  });

  it('starts Quick Task at /quick/task with a distinct identity', () => {
    const manifest = JSON.parse(readPublic('quick-task.webmanifest')) as {
      id: string;
      start_url: string;
      scope: string;
      display: string;
      icons: ReadonlyArray<{ src: string }>;
    };
    expect(manifest.id).toBe('/quick/task');
    expect(manifest.start_url).toBe('/quick/task');
    expect(manifest.scope).toBe('/quick');
    expect(manifest.display).toBe('standalone');
    expect(JSON.stringify(manifest.icons)).toContain('quick-task-192.png?v=plus1');
    expect(JSON.stringify(manifest.icons)).not.toContain('/icons/icon-192.png');
  });
});
