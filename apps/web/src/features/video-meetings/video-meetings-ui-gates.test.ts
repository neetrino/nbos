import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../../..');

describe('video meetings UI gates', () => {
  it('guest join page does not import the authenticated app layout', () => {
    const guestPage = readFileSync(
      join(repoRoot, 'apps/web/src/features/video-meetings/GuestVideoMeetingJoinPage.tsx'),
      'utf8',
    );
    expect(guestPage).toContain('data-video-meeting-guest-shell');
    expect(guestPage).not.toContain('AppLayout');
    expect(guestPage).not.toContain('Sidebar');
  });

  it('employee routes call ensureVideoMeetingsWebEnabled', () => {
    const listPage = readFileSync(
      join(repoRoot, 'apps/web/src/app/(app)/video-meetings/page.tsx'),
      'utf8',
    );
    expect(listPage).toContain('ensureVideoMeetingsWebEnabled');
  });
});
