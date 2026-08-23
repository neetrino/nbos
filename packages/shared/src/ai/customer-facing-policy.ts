import type { AiPolicyOutcome } from './policy-decision';
import {
  AI_MESSENGER_DRAFT_CAPABILITY_KEY,
  AI_MESSENGER_SEND_CAPABILITY_KEY,
  type AiCustomerContentVisibility,
  type AiCustomerFacingAction,
  type AiCustomerFacingMode,
} from './customer-facing-types';

export type AiCustomerFacingDenial =
  | 'DRAFT_CAPABILITY_REQUIRED'
  | 'SEND_CAPABILITY_REQUIRED'
  | 'SEND_FORBIDDEN_IN_DRAFT_ONLY'
  | 'INTERNAL_ONLY_FORBIDDEN'
  | 'AUTO_SEND_CATEGORY_REQUIRED';

export interface AiCustomerFacingRequest {
  mode: AiCustomerFacingMode;
  action: AiCustomerFacingAction;
  hasDraftCapability: boolean;
  hasSendCapability: boolean;
  /**
   * Low-risk category for AUTO_SEND_ALLOWED. An empty allowlist means nothing
   * auto-sends. Message text is not an input and cannot change this decision.
   */
  autoSendCategory?: string | null;
  allowedAutoSendCategories?: readonly string[];
}

export type AiCustomerFacingDecision =
  | { outcome: Extract<AiPolicyOutcome, 'ALLOW'>; action: AiCustomerFacingAction }
  | {
      outcome: Extract<AiPolicyOutcome, 'REQUIRE_APPROVAL'>;
      action: 'send';
      capabilityKey: typeof AI_MESSENGER_SEND_CAPABILITY_KEY;
    }
  | { outcome: 'DENY'; reason: AiCustomerFacingDenial };

export function evaluateCustomerFacingAction(
  request: AiCustomerFacingRequest,
): AiCustomerFacingDecision {
  if (request.action === 'escalate') {
    return { outcome: 'ALLOW', action: 'escalate' };
  }
  if (request.action === 'draft') {
    return request.hasDraftCapability
      ? { outcome: 'ALLOW', action: 'draft' }
      : { outcome: 'DENY', reason: 'DRAFT_CAPABILITY_REQUIRED' };
  }
  return evaluateSend(request);
}

export function assertCustomerDisclosable(
  visibility: AiCustomerContentVisibility,
): { ok: true } | { ok: false; reason: 'INTERNAL_ONLY_FORBIDDEN' } {
  if (visibility === 'INTERNAL_ONLY') {
    return { ok: false, reason: 'INTERNAL_ONLY_FORBIDDEN' };
  }
  return { ok: true };
}

export function draftDoesNotGrantSend(grantedKeys: readonly string[]): boolean {
  return (
    grantedKeys.includes(AI_MESSENGER_DRAFT_CAPABILITY_KEY) &&
    !grantedKeys.includes(AI_MESSENGER_SEND_CAPABILITY_KEY)
  );
}

function evaluateSend(request: AiCustomerFacingRequest): AiCustomerFacingDecision {
  if (!request.hasSendCapability) {
    return { outcome: 'DENY', reason: 'SEND_CAPABILITY_REQUIRED' };
  }
  if (request.mode === 'DRAFT_ONLY') {
    return { outcome: 'DENY', reason: 'SEND_FORBIDDEN_IN_DRAFT_ONLY' };
  }
  if (request.mode === 'APPROVAL_REQUIRED') {
    return requireSendApproval();
  }
  return evaluateAutoSend(request);
}

function evaluateAutoSend(request: AiCustomerFacingRequest): AiCustomerFacingDecision {
  const allowed = request.allowedAutoSendCategories ?? [];
  const category = request.autoSendCategory?.trim() ?? '';
  if (allowed.length === 0) {
    return requireSendApproval();
  }
  if (!category) {
    return { outcome: 'DENY', reason: 'AUTO_SEND_CATEGORY_REQUIRED' };
  }
  if (!allowed.includes(category)) {
    return requireSendApproval();
  }
  return { outcome: 'ALLOW', action: 'send' };
}

function requireSendApproval(): Extract<AiCustomerFacingDecision, { outcome: 'REQUIRE_APPROVAL' }> {
  return {
    outcome: 'REQUIRE_APPROVAL',
    action: 'send',
    capabilityKey: AI_MESSENGER_SEND_CAPABILITY_KEY,
  };
}
