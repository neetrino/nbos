import { validateRedistributionPair, type RedistributionValidationError } from '@nbos/shared';
import { ApiError } from '@/lib/api-errors';
import type {
  ReplaceEmployeeBody,
  ReplacementPlanComponentDto,
  ReplacementPlanHolderDto,
} from '@/lib/api/delivery-configurations';
import {
  EMPTY_SHARE_PERCENT,
  REPLACEMENT_CONFLICT_CODE,
  REPLACEMENT_CONFLICT_HTTP_STATUS,
  UNSELECTED_EMPLOYEE_ID,
  UNSELECTED_ROLE,
} from './replace-assignee.constants';

export type ShareDraft = {
  componentId: string;
  outgoingPercent: string;
  incomingPercent: string;
};

export type ReplacementSubmitInput = {
  roleKey: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  reason: string;
  shares: readonly ShareDraft[];
  componentIds: readonly string[];
  expectedRevision: number | null;
};

export function createEmptyShareDrafts(componentIds: readonly string[]): ShareDraft[] {
  return componentIds.map((componentId) => ({
    componentId,
    outgoingPercent: EMPTY_SHARE_PERCENT,
    incomingPercent: EMPTY_SHARE_PERCENT,
  }));
}

export function updateSharePercent(
  shares: readonly ShareDraft[],
  componentId: string,
  field: 'outgoingPercent' | 'incomingPercent',
  value: string,
): ShareDraft[] {
  return shares.map((share) =>
    share.componentId === componentId ? { ...share, [field]: value } : share,
  );
}

export function uniqueHolders(
  components: readonly ReplacementPlanComponentDto[],
): ReplacementPlanHolderDto[] {
  const seen = new Map<string, ReplacementPlanHolderDto>();
  for (const component of components) {
    for (const holder of component.holders) {
      if (!seen.has(holder.employeeId)) {
        seen.set(holder.employeeId, holder);
      }
    }
  }
  return [...seen.values()];
}

/**
 * Components the outgoing employee actually holds. The same role can be split across people
 * after an earlier replacement, and the server redistributes only what this person holds.
 */
export function componentsHeldBy(
  components: readonly ReplacementPlanComponentDto[],
  fromEmployeeId: string,
): ReplacementPlanComponentDto[] {
  if (fromEmployeeId === UNSELECTED_EMPLOYEE_ID) {
    return [];
  }
  return components.filter((component) =>
    component.holders.some((holder) => holder.employeeId === fromEmployeeId),
  );
}

export function findOutgoingHolder(
  component: ReplacementPlanComponentDto,
  fromEmployeeId: string,
): ReplacementPlanHolderDto | undefined {
  return component.holders.find((holder) => holder.employeeId === fromEmployeeId);
}

export function shareValidationError(share: ShareDraft): RedistributionValidationError | null {
  return validateRedistributionPair(share);
}

export function coversEveryComponent(
  shares: readonly ShareDraft[],
  componentIds: readonly string[],
): boolean {
  if (shares.length !== componentIds.length) {
    return false;
  }
  const present = new Set(shares.map((share) => share.componentId));
  return componentIds.every((componentId) => present.has(componentId));
}

export function canSubmitReplacement(input: ReplacementSubmitInput): boolean {
  if (input.roleKey === UNSELECTED_ROLE || input.roleKey.trim() === '') {
    return false;
  }
  if (
    input.fromEmployeeId === UNSELECTED_EMPLOYEE_ID ||
    input.toEmployeeId === UNSELECTED_EMPLOYEE_ID
  ) {
    return false;
  }
  if (input.fromEmployeeId === input.toEmployeeId) {
    return false;
  }
  if (input.reason.trim() === '') {
    return false;
  }
  if (!coversEveryComponent(input.shares, input.componentIds)) {
    return false;
  }
  return input.shares.every((share) => shareValidationError(share) === null);
}

export function buildReplaceEmployeeBody(
  input: ReplacementSubmitInput,
): ReplaceEmployeeBody | null {
  if (!canSubmitReplacement(input)) {
    return null;
  }
  const body: ReplaceEmployeeBody = {
    roleKey: input.roleKey,
    fromEmployeeId: input.fromEmployeeId,
    toEmployeeId: input.toEmployeeId,
    shares: input.shares.map((share) => ({
      componentId: share.componentId,
      outgoingPercent: share.outgoingPercent.trim(),
      incomingPercent: share.incomingPercent.trim(),
    })),
    reason: input.reason.trim(),
  };
  if (input.expectedRevision !== null) {
    body.expectedRevision = input.expectedRevision;
  }
  return body;
}

export function isReplacementConflictError(caught: unknown): boolean {
  if (!(caught instanceof ApiError)) {
    return false;
  }
  return (
    caught.statusCode === REPLACEMENT_CONFLICT_HTTP_STATUS ||
    caught.code === REPLACEMENT_CONFLICT_CODE
  );
}
