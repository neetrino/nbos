import type { MeResponse } from '@/lib/permissions/types';

export function isOpenRisingEdge(wasOpen: boolean, isOpen: boolean): boolean {
  return !wasOpen && isOpen;
}

export function canSubmitQuickCreateTask(title: string, creatorId: string): boolean {
  return Boolean(title.trim()) && Boolean(creatorId);
}

export function isQuickCreateCreatorBlocked(creatorReady: boolean, creatorId: string): boolean {
  return creatorReady && !creatorId;
}

export function shouldApplyDefaultAssignee(
  assigneeTouched: boolean,
  creatorId: string,
  me: MeResponse | null | undefined,
): boolean {
  return !assigneeTouched && Boolean(creatorId) && Boolean(me);
}

export function displayNameFromMe(me: MeResponse): string {
  const full = `${me.firstName} ${me.lastName}`.trim();
  return full || me.email;
}

export interface QuickCreateOwnedDraft {
  title: string;
  description: string;
  assigneeId: string;
  assigneeTouched: boolean;
}

/**
 * Models the open-dialog identity transition: late /api/me may enrich assignee,
 * but must not reset user-owned draft fields.
 */
export function applyLateIdentityArrival(
  draft: QuickCreateOwnedDraft,
  wasOpen: boolean,
  isOpen: boolean,
  creatorId: string,
  me: MeResponse | null | undefined,
): { resetDraft: boolean; assigneeId: string } {
  if (isOpenRisingEdge(wasOpen, isOpen)) {
    return { resetDraft: true, assigneeId: creatorId && me ? creatorId : '' };
  }
  if (shouldApplyDefaultAssignee(draft.assigneeTouched, creatorId, me)) {
    return { resetDraft: false, assigneeId: creatorId };
  }
  return { resetDraft: false, assigneeId: draft.assigneeId };
}
