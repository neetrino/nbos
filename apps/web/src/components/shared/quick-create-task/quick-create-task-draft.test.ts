import { describe, expect, it } from 'vitest';
import type { MeResponse } from '@/lib/permissions/types';
import {
  canSubmitQuickCreateTask,
  displayNameFromMe,
  isOpenRisingEdge,
  isQuickCreateCreatorBlocked,
  shouldApplyDefaultAssignee,
  applyLateIdentityArrival,
} from './quick-create-task-draft';

const me = {
  id: 'emp-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@nbos.test',
} as MeResponse;

describe('quick-create-task-draft', () => {
  it('resets only on the open rising edge', () => {
    expect(isOpenRisingEdge(false, true)).toBe(true);
    expect(isOpenRisingEdge(true, true)).toBe(false);
    expect(isOpenRisingEdge(true, false)).toBe(false);
    expect(isOpenRisingEdge(false, false)).toBe(false);
  });

  it('requires a real creator id before submit', () => {
    expect(canSubmitQuickCreateTask('Ship it', '')).toBe(false);
    expect(canSubmitQuickCreateTask('Ship it', 'emp-1')).toBe(true);
    expect(canSubmitQuickCreateTask('   ', 'emp-1')).toBe(false);
  });

  it('blocks create after identity is ready without an employee', () => {
    expect(isQuickCreateCreatorBlocked(false, '')).toBe(false);
    expect(isQuickCreateCreatorBlocked(true, '')).toBe(true);
    expect(isQuickCreateCreatorBlocked(true, 'emp-1')).toBe(false);
  });

  it('applies default assignee only when the user has not chosen one', () => {
    expect(shouldApplyDefaultAssignee(false, 'emp-1', me)).toBe(true);
    expect(shouldApplyDefaultAssignee(true, 'emp-1', me)).toBe(false);
    expect(shouldApplyDefaultAssignee(false, '', me)).toBe(false);
    expect(shouldApplyDefaultAssignee(false, 'emp-1', null)).toBe(false);
  });

  it('keeps a late identity from replacing a manual assignee decision', () => {
    const lateMe = { ...me, id: 'emp-2', firstName: 'Late' };
    expect(shouldApplyDefaultAssignee(true, lateMe.id, lateMe)).toBe(false);
  });

  it('formats the current employee label', () => {
    expect(displayNameFromMe(me)).toBe('Ada Lovelace');
    expect(displayNameFromMe({ ...me, firstName: '', lastName: '' })).toBe('ada@nbos.test');
  });

  it('does not treat identity or search updates as a reason to reset user-owned fields', () => {
    expect(isOpenRisingEdge(true, true)).toBe(false);
    expect(shouldApplyDefaultAssignee(true, 'emp-1', me)).toBe(false);
  });

  it('keeps a typed draft when /api/me arrives while the dialog stays open', () => {
    const typed = {
      title: 'Call client',
      description: 'after standup',
      assigneeId: '',
      assigneeTouched: false,
    };
    const next = applyLateIdentityArrival(typed, true, true, me.id, me);
    expect(next.resetDraft).toBe(false);
    expect(next.assigneeId).toBe(me.id);
    expect(typed.title).toBe('Call client');
    expect(typed.description).toBe('after standup');
  });

  it('does not replace a manual assignee when identity arrives late', () => {
    const typed = {
      title: 'Review PR',
      description: '',
      assigneeId: 'emp-other',
      assigneeTouched: true,
    };
    const next = applyLateIdentityArrival(typed, true, true, me.id, me);
    expect(next.resetDraft).toBe(false);
    expect(next.assigneeId).toBe('emp-other');
  });
});
