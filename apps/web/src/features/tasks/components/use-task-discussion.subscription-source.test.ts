import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('task discussion subscription wiring', () => {
  it('retains through the shared runtime only while discussion is open', () => {
    const hook = readSrc('features/tasks/components/use-task-discussion.ts');
    const sheet = readSrc('features/tasks/components/TaskSheet.tsx');
    const panel = readSrc('features/tasks/components/TaskSheetChatPanel.tsx');
    expect(hook).toContain('useInternalMessengerRealtime');
    expect(hook).not.toMatch(/\bio\(/);
    expect(sheet).toContain('const discussionOpen = open && (!isMobileViewport || chatOpen)');
    expect(sheet).toContain('useTaskDiscussion(sheetId, discussionOpen)');
    expect(sheet.match(/composerDisabled=\{discussion\.composerDisabled\}/g)).toHaveLength(2);
    expect(panel).toContain('disabled={composerDisabled}');
    expect(panel).not.toContain('disabled={false}');
  });
});

function readSrc(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), 'apps/web/src', relativePath), 'utf8');
}
