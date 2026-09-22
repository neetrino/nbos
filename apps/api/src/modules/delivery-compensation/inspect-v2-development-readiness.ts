import {
  calculateDeliveryPlan,
  requiredAssigneeRoles,
  type DeliveryCompensationErrorCode,
  type DeliveryCompensationRoleKey,
} from '@nbos/shared';
import type { LoadedPublishedNormatives } from './load-published-delivery-normatives';

export type V2ReadinessResult =
  | { apply: false; reason: 'LEGACY_OR_ABSENT' | 'ALREADY_MATERIALIZED' }
  | {
      apply: true;
      errors: DeliveryCompensationErrorCode[];
      assignedRoles: Partial<Record<DeliveryCompensationRoleKey, string>>;
      normatives: LoadedPublishedNormatives;
    };

export function inspectV2DevelopmentReadiness(input: {
  mode: string | null | undefined;
  initialRevisionId: string | null | undefined;
  checkedAt: Date | null | undefined;
  assignees: Partial<Record<DeliveryCompensationRoleKey, string>>;
  normatives: LoadedPublishedNormatives | null;
}): V2ReadinessResult {
  if (!input.mode || input.mode !== 'V2') {
    return { apply: false, reason: 'LEGACY_OR_ABSENT' };
  }
  if (input.initialRevisionId) {
    return { apply: false, reason: 'ALREADY_MATERIALIZED' };
  }

  const errors: DeliveryCompensationErrorCode[] = [];
  if (!input.checkedAt || !input.normatives) {
    errors.push('CONFIGURATION_INCOMPLETE');
    return { apply: true, errors, assignedRoles: input.assignees, normatives: emptyNormatives() };
  }

  const plan = calculateDeliveryPlan({
    baseRoleUnits: input.normatives.baseRoleUnits,
    rates: input.normatives.rates,
    features: input.normatives.features,
  });
  errors.push(...plan.errors);
  const missingAssignees = requiredRolesFromNormatives(input.normatives).filter(
    (role) => !input.assignees[role],
  );
  if (missingAssignees.length > 0) {
    errors.push('ROLE_ASSIGNMENT_REQUIRED');
  }

  return {
    apply: true,
    errors: [...new Set(errors)],
    assignedRoles: input.assignees,
    normatives: input.normatives,
  };
}

function requiredRolesFromNormatives(
  normatives: LoadedPublishedNormatives,
): DeliveryCompensationRoleKey[] {
  const roles = new Set(requiredAssigneeRoles(normatives.baseRoleUnits));
  for (const feature of normatives.features) {
    if (feature.origin === 'INCLUDED') {
      continue;
    }
    for (const role of requiredAssigneeRoles(feature.roleUnits)) {
      roles.add(role);
    }
  }
  return [...roles];
}

function emptyNormatives(): LoadedPublishedNormatives {
  return {
    designMode: 'AI_DESIGN',
    aiDesignerReview: false,
    baseRoleUnits: [],
    rates: [],
    features: [],
  };
}
