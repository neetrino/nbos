import { describe, expect, it } from 'vitest';
import { shouldFreezeOutgoingTabPanel } from './detail-sheet-tab-panel';

describe('shouldFreezeOutgoingTabPanel', () => {
  it('keeps the active tab live so mid-string edits do not snapshot children', () => {
    expect(shouldFreezeOutgoingTabPanel('general', 'general', false)).toBe(false);
  });

  it('freezes the previous body only when the tab changes', () => {
    expect(shouldFreezeOutgoingTabPanel('general', 'calls', false)).toBe(true);
  });

  it('does not start a second freeze while a crossfade is already outgoing', () => {
    expect(shouldFreezeOutgoingTabPanel('general', 'history', true)).toBe(false);
  });
});
