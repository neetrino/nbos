import { NotFoundException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import type { DeliveryCompensationRoleKey } from '@nbos/shared';
import {
  firstReadinessError,
  throwDeliveryCompensationError,
} from './delivery-compensation-http-error';
import { inspectV2DevelopmentReadiness } from './inspect-v2-development-readiness';
import {
  loadV2Assignees,
  loadV2Normatives,
  MATERIALIZE_CONFIG_INCLUDE,
} from './load-v2-materialize-context';
import { lockDeliveryConfigurationRow } from './lock-delivery-configuration';
import { writeInitialDeliveryPlan } from './write-initial-delivery-plan';

export type MaterializeInitialPlanResult =
  | { status: 'SKIPPED_LEGACY' }
  | { status: 'ALREADY_MATERIALIZED'; orderId: string }
  | { status: 'CREATED'; orderId: string; revisionId: string; bonusEntryIds: string[] };

export type MaterializeInitialPlanInput = {
  entityKind: 'PRODUCT' | 'EXTENSION';
  productId?: string;
  extensionId?: string;
  actorEmployeeId?: string;
};

export async function materializeInitialDeliveryPlanIfNeeded(
  db: TransactionClient,
  input: MaterializeInitialPlanInput,
): Promise<MaterializeInitialPlanResult> {
  const configuration = await db.deliveryConfiguration.findFirst({
    where:
      input.entityKind === 'PRODUCT'
        ? { productId: input.productId }
        : { extensionId: input.extensionId },
    include: MATERIALIZE_CONFIG_INCLUDE,
  });
  if (!configuration || configuration.mode !== 'V2') {
    return { status: 'SKIPPED_LEGACY' };
  }

  const locked = await lockAndReloadConfiguration(db, configuration.id);
  if (locked.mode !== 'V2') {
    return { status: 'SKIPPED_LEGACY' };
  }
  if (locked.initialRevisionId) {
    return { status: 'ALREADY_MATERIALIZED', orderId: locked.orderId };
  }

  return createInitialPlan(db, input, locked);
}

async function createInitialPlan(
  db: TransactionClient,
  input: MaterializeInitialPlanInput,
  locked: NonNullable<Awaited<ReturnType<typeof lockAndReloadConfiguration>>>,
): Promise<MaterializeInitialPlanResult> {
  const asOf = new Date();
  const assignees = await loadV2Assignees(db, input);
  const readiness = inspectV2DevelopmentReadiness({
    mode: locked.mode,
    initialRevisionId: locked.initialRevisionId,
    checkedAt: locked.checkedAt,
    assignees,
    normatives: await loadV2Normatives(db, locked, asOf),
  });
  if (!readiness.apply) {
    return { status: 'ALREADY_MATERIALIZED', orderId: locked.orderId };
  }
  const error = firstReadinessError(readiness.errors);
  if (error) {
    throwDeliveryCompensationError(error);
  }
  const written = await writeInitialDeliveryPlan(db, {
    configurationId: locked.id,
    orderId: locked.orderId,
    projectId: locked.order.projectId,
    actorEmployeeId: resolveActor(input.actorEmployeeId, locked.checkedById, assignees),
    assignees: readiness.assignedRoles,
    normatives: readiness.normatives,
    features: locked.features.filter((feature) => feature.archivedAt === null),
    asOf,
  });
  return {
    status: 'CREATED',
    orderId: locked.orderId,
    revisionId: written.revisionId,
    bonusEntryIds: written.bonusEntryIds,
  };
}

async function lockAndReloadConfiguration(db: TransactionClient, configurationId: string) {
  await lockDeliveryConfigurationRow(db, configurationId);
  const locked = await db.deliveryConfiguration.findUnique({
    where: { id: configurationId },
    include: MATERIALIZE_CONFIG_INCLUDE,
  });
  if (!locked) {
    throw new NotFoundException('Configuration not found');
  }
  return locked;
}

function resolveActor(
  actorEmployeeId: string | undefined,
  checkedById: string | null,
  assignees: Partial<Record<DeliveryCompensationRoleKey, string>>,
): string {
  const actor = actorEmployeeId || checkedById || assignees.PM;
  if (!actor) {
    throwDeliveryCompensationError('CONFIGURATION_INCOMPLETE');
  }
  return actor;
}
