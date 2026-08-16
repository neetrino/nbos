import { beforeEach, describe, expect, it } from 'vitest';
import type { Task } from '@/lib/api/tasks';
import {
  clearEmployeeLabelCache,
  rememberEmployeeAvatar,
  rememberEmployeeLabel,
} from './task-employee-labels';
import { applyResolvedEmployeeLabels, createTaskGeneralDraft } from './task-general-form-state';

const ASSISTANT_ID = '14b22deb-5998-4bb5-aaba-f3ad5a0a8ff8';

const baseTask = {
  id: 't1',
  code: 'T-2026-0001',
  title: 'Example',
  description: null,
  status: 'OPEN',
  priority: 'NORMAL',
  dueDate: null,
  completedAt: null,
  reviewRequestedAt: null,
  reviewApprovedAt: null,
  completionRules: null,
  parentId: null,
  workspaceId: null,
  planningStatus: 'UNPLANNED',
  myPlanStageId: null,
  myPlanSortOrder: 0,
  workspaceSortOrder: 0,
  chatId: null,
  isRecurring: false,
  coAssignees: [] as string[],
  observers: [] as string[],
  createdAt: '',
  updatedAt: '',
  creator: { id: 'c1', firstName: 'Jasmine', lastName: 'Ghazaryan' },
  assignee: { id: 'a1', firstName: 'Karo', lastName: 'Gabrielyan' },
  links: [],
  checklists: [],
  subtasks: [],
  _count: { subtasks: 0, checklists: 0 },
} satisfies Task;

describe('createTaskGeneralDraft', () => {
  beforeEach(() => {
    clearEmployeeLabelCache();
  });

  it('seeds assistant names from cache on first paint', () => {
    rememberEmployeeLabel(ASSISTANT_ID, 'Anna Petrosyan');
    const draft = createTaskGeneralDraft({
      ...baseTask,
      coAssignees: [ASSISTANT_ID],
    });
    expect(draft.coAssigneeLabels[ASSISTANT_ID]).toBe('Anna Petrosyan');
  });

  it('uses creator name when the same person is an assistant', () => {
    const draft = createTaskGeneralDraft({
      ...baseTask,
      coAssignees: [baseTask.creator.id],
    });
    expect(draft.coAssigneeLabels[baseTask.creator.id]).toBe('Jasmine Ghazaryan');
  });

  it('does not put a raw id into assistant labels', () => {
    const draft = createTaskGeneralDraft({
      ...baseTask,
      coAssignees: [ASSISTANT_ID],
    });
    expect(draft.coAssigneeLabels).toEqual({});
  });

  it('seeds assistant avatars from cache on first paint', () => {
    rememberEmployeeAvatar(ASSISTANT_ID, 'https://cdn.example/a.png');
    const draft = createTaskGeneralDraft({
      ...baseTask,
      coAssignees: [ASSISTANT_ID],
    });
    expect(draft.coAssigneeAvatars[ASSISTANT_ID]).toBe('https://cdn.example/a.png');
  });

  it('uses creator avatar when the same person is an assistant', () => {
    const draft = createTaskGeneralDraft({
      ...baseTask,
      creator: { ...baseTask.creator, avatar: 'https://cdn.example/j.png' },
      coAssignees: [baseTask.creator.id],
    });
    expect(draft.coAssigneeAvatars[baseTask.creator.id]).toBe('https://cdn.example/j.png');
  });
});

describe('applyResolvedEmployeeLabels', () => {
  it('fills missing assistant names from the resolved draft', () => {
    const current = createTaskGeneralDraft({
      ...baseTask,
      coAssignees: [ASSISTANT_ID],
    });
    const resolved = {
      ...current,
      coAssigneeLabels: { [ASSISTANT_ID]: 'Anna Petrosyan' },
    };
    const next = applyResolvedEmployeeLabels(current, resolved);
    expect(next?.coAssigneeLabels[ASSISTANT_ID]).toBe('Anna Petrosyan');
  });

  it('merges assistant avatars from the resolved draft', () => {
    const current = createTaskGeneralDraft({
      ...baseTask,
      coAssignees: [ASSISTANT_ID],
    });
    const resolved = {
      ...current,
      coAssigneeAvatars: { [ASSISTANT_ID]: 'https://cdn.example/a.png' },
    };
    const next = applyResolvedEmployeeLabels(current, resolved);
    expect(next?.coAssigneeAvatars[ASSISTANT_ID]).toBe('https://cdn.example/a.png');
  });
});
