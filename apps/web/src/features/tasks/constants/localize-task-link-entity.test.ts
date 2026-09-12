import { describe, expect, it } from 'vitest';
import { localizeTaskLinkEntityLabel } from './localize-task-link-entity';

describe('localizeTaskLinkEntityLabel', () => {
  it('translates known types and aliases WORKSPACE', () => {
    expect(localizeTaskLinkEntityLabel('LEAD', (key) => key, 'Lead')).toBe('sheet.entity.LEAD');
    expect(localizeTaskLinkEntityLabel('WORKSPACE', (key) => key, 'Work Space')).toBe(
      'sheet.entity.WORK_SPACE',
    );
  });

  it('keeps unknown stored codes', () => {
    expect(localizeTaskLinkEntityLabel('CUSTOM', (key) => key, 'CUSTOM')).toBe('CUSTOM');
  });
});
