import { describe, expect, it } from 'vitest';
import type { RecurringTaskTemplate } from '@/lib/api/recurring-tasks';
import {
  createEmptyRecurringDraft,
  createRecurringDraftFromTemplate,
  isRecurringDraftDirty,
  recurringDraftToPayload,
} from './recurring-task-form-state';

const TEMPLATE: RecurringTaskTemplate = {
  id: 'tpl-1',
  title: 'Check domains',
  description: 'Monthly pass',
  frequency: 'MONTHLY',
  interval: 1,
  daysOfWeek: [],
  dayOfMonth: 10,
  priority: 'HIGH',
  isActive: true,
  startDate: '2026-05-10T09:00:00.000Z',
  endDate: null,
  dueDateOffset: 2,
  lastCreatedAt: null,
  nextCreateAt: '2026-06-10T09:00:00.000Z',
  checklistData: { title: 'Checklist', items: ['WHOIS', 'SSL'] },
  linksData: null,
  spawnedTaskCount: 3,
  creator: { id: 'c1', firstName: 'Ada', lastName: 'Lovelace' },
  assignee: { id: 'a1', firstName: 'Alan', lastName: 'Turing' },
};

describe('recurring-task-form-state', () => {
  it('builds a payload from a template draft', () => {
    const draft = createRecurringDraftFromTemplate(TEMPLATE);
    const payload = recurringDraftToPayload(draft);
    expect(payload.title).toBe('Check domains');
    expect(payload.frequency).toBe('MONTHLY');
    expect(payload.dayOfMonth).toBe(10);
    expect(payload.dueDateOffset).toBe(2);
    expect(payload.priority).toBe('HIGH');
    expect(payload.assigneeId).toBe('a1');
    expect(payload.checklistData?.items).toEqual(['WHOIS', 'SSL']);
  });

  it('detects dirty title changes', () => {
    const snap = createEmptyRecurringDraft(new Date('2026-05-06T10:00:00.000Z'));
    const draft = { ...snap, title: 'New title' };
    expect(isRecurringDraftDirty(draft, snap)).toBe(true);
    expect(isRecurringDraftDirty(snap, snap)).toBe(false);
  });
});
