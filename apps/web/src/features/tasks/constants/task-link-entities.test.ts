import { describe, expect, it } from 'vitest';
import { UserRound } from 'lucide-react';
import {
  isTaskEditableLinkType,
  taskLinkEntityIcon,
  taskLinkEntityLabel,
} from './task-link-entities';

describe('task-link-entities LEAD', () => {
  it('labels LEAD and uses the lead icon', () => {
    expect(taskLinkEntityLabel('LEAD')).toBe('Lead');
    expect(taskLinkEntityIcon('LEAD')).toBe(UserRound);
  });

  it('keeps LEAD read-only like DEAL', () => {
    expect(isTaskEditableLinkType('LEAD')).toBe(false);
    expect(isTaskEditableLinkType('DEAL')).toBe(false);
    expect(isTaskEditableLinkType('PROJECT')).toBe(true);
  });
});
