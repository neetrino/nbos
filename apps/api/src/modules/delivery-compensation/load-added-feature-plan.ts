import type { TransactionClient } from '@nbos/database';
import {
  calculateDeliveryPlan,
  type DeliveryCompensationRoleKey,
  type DeliveryDesignMode,
  type DeliveryPlanLine,
} from '@nbos/shared';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';
import {
  loadPublishedDeliveryNormatives,
  type NormativeRoleUnitRow,
} from './load-published-delivery-normatives';
import { loadV2Assignees } from './load-v2-materialize-context';

export async function loadAddedFeaturePlan(
  db: TransactionClient,
  input: {
    configuration: {
      entityKind: 'PRODUCT' | 'EXTENSION';
      productId: string | null;
      extensionId: string | null;
      designMode: string | null;
      aiDesignerReview: boolean;
      baseProfileVersion: { roleUnits: NormativeRoleUnitRow[] };
    };
    functionId: string;
  },
): Promise<{
  lines: DeliveryPlanLine[];
  assignees: Partial<Record<DeliveryCompensationRoleKey, string>>;
}> {
  if (!input.configuration.designMode) {
    throwDeliveryCompensationError('CONFIGURATION_INCOMPLETE');
  }
  const asOf = new Date();
  const assignees = await loadV2Assignees(db, {
    entityKind: input.configuration.entityKind,
    productId: input.configuration.productId ?? undefined,
    extensionId: input.configuration.extensionId ?? undefined,
  });
  const plan = calculateDeliveryPlan({
    ...loadPublishedDeliveryNormatives({
      asOf,
      designMode: input.configuration.designMode as DeliveryDesignMode,
      aiDesignerReview: input.configuration.aiDesignerReview,
      baseRoleUnits: input.configuration.baseProfileVersion.roleUnits,
      rates: await db.deliveryRoleRateVersion.findMany({ where: { status: 'PUBLISHED' } }),
      features: [{ functionId: input.functionId, origin: 'EXTRA', selectedPriceVersionId: null }],
      extraPriceVersions: await db.deliveryFunctionPriceVersion.findMany({
        where: { functionId: input.functionId },
        include: { roleUnits: true },
      }),
    }),
    designerAssigned: Boolean(assignees.DESIGNER),
    frozenComponents: [],
  });
  if (plan.errors.length > 0) {
    throwDeliveryCompensationError(plan.errors[0] ?? 'NORMATIVE_NOT_CONFIGURED');
  }
  return {
    assignees,
    lines: plan.lines.filter((line) => line.componentKey === `FEATURE:${input.functionId}`),
  };
}
