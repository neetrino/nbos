import { inspectV2DevelopmentReadiness } from './inspect-v2-development-readiness';
import {
  loadV2Assignees,
  loadV2Normatives,
  type DeliveryQueryClient,
} from './load-v2-materialize-context';
import type { NormativeRoleUnitRow } from './load-published-delivery-normatives';
import type { OperationalConfigurationDto } from './serialize-operational-configuration';

export type ReadinessConfigRow = {
  mode: string;
  productId: string | null;
  extensionId: string | null;
  initialRevisionId: string | null;
  checkedAt: Date | null;
  designMode: string | null;
  aiDesignerReview: boolean;
  baseProfileVersion: { roleUnits: NormativeRoleUnitRow[] } | null;
  features: Array<{
    functionId: string;
    origin: 'INCLUDED' | 'EXTRA';
    selectedPriceVersionId: string | null;
    archivedAt: Date | null;
  }>;
};

export async function attachConfigurationReadiness(
  db: DeliveryQueryClient,
  row: ReadinessConfigRow,
): Promise<OperationalConfigurationDto['readiness']> {
  if (row.mode !== 'V2') {
    return { planState: 'LEGACY', errors: [] };
  }
  if (row.initialRevisionId) {
    return { planState: 'MATERIALIZED', errors: [] };
  }
  const inspected = inspectV2DevelopmentReadiness({
    mode: row.mode,
    initialRevisionId: row.initialRevisionId,
    checkedAt: row.checkedAt,
    assignees: await loadV2Assignees(db, {
      entityKind: row.extensionId ? 'EXTENSION' : 'PRODUCT',
      productId: row.productId ?? undefined,
      extensionId: row.extensionId ?? undefined,
    }),
    normatives: await loadV2Normatives(db, row, new Date()),
  });
  if (!inspected.apply) {
    return { planState: 'MATERIALIZED', errors: [] };
  }
  return {
    planState: inspected.errors.length === 0 ? 'READY' : 'DRAFT',
    errors: inspected.errors,
  };
}
