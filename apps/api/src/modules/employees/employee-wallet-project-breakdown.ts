import type {
  BonusReleaseStatusEnum,
  BonusReleaseTypeEnum,
  Decimal,
  ProductBonusPoolStatusEnum,
} from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { BONUS_RELEASE_COUNTING_STATUSES } from '../bonus/product-bonus-pool.constants';
import type { WalletReleaseRollup } from './employee-wallet-bonus-release-rollups';

const COUNTING = new Set<string>(BONUS_RELEASE_COUNTING_STATUSES);

export const WALLET_FUNDING_LABEL = {
  WITHIN_POOL: 'Within Pool',
  PARTIAL: 'Partial',
  EXTRA_BONUS: 'Extra Bonus',
  OVER_FUNDING: 'Over Funding',
  EARLY_RELEASE: 'Early Release',
} as const;

export interface EmployeeWalletProjectBreakdownRow {
  orderId: string;
  projectId: string;
  project: { code: string; name: string };
  order: { code: string };
  /** Product / extension scope for the bonus pool (NBOS §5). */
  productLabel: string;
  bonusTypesSummary: string;
  plannedBonus: string;
  releasedBonus: string;
  paidBonus: string;
  remainingBonus: string;
  fundingStatusLabels: string[];
  poolAvailableFunding: string | null;
  poolOverFunding: string | null;
  entryStatusesSummary: string;
  payoutState: 'UNPAID' | 'PARTIAL' | 'PAID';
}

export interface WalletPoolForBreakdown {
  orderId: string;
  availableFunding: Decimal;
  overFundingAmount: Decimal;
  totalPlannedAmount: Decimal;
  totalReleasedAmount: Decimal;
  status: ProductBonusPoolStatusEnum;
  productName: string | null;
  extensionName: string | null;
}

export interface WalletBonusEntryForBreakdown {
  id: string;
  orderId: string;
  projectId: string;
  type: string;
  status: string;
  amount: Decimal;
  project: { code: string; name: string };
  order: { code: string };
}

export interface WalletReleaseTypeRow {
  bonusEntryId: string;
  releaseType: BonusReleaseTypeEnum;
  status: BonusReleaseStatusEnum;
}

/** Product / extension / order scope for wallet (NBOS: commercial unit ≈ order pool). */
export function walletBonusScopeLabel(
  pool: WalletPoolForBreakdown | undefined,
  orderCode: string,
): string {
  if (!pool) {
    return `Order ${orderCode}`;
  }
  if (pool.productName) {
    return pool.productName;
  }
  if (pool.extensionName) {
    return `Extension: ${pool.extensionName}`;
  }
  return `Order ${orderCode}`;
}

function formatProductLabel(pool: WalletPoolForBreakdown | undefined, orderCode: string): string {
  return walletBonusScopeLabel(pool, orderCode);
}

/** Derives NBOS wallet funding labels for one order row (pool + this employee's qualifying releases). */
export function deriveWalletOrderFundingLabels(input: {
  poolOverFunding: Decimal;
  releaseTypes: BonusReleaseTypeEnum[];
  poolStatus: ProductBonusPoolStatusEnum | null;
  employeeReleased: Decimal;
  employeeRemaining: Decimal;
}): string[] {
  const labels: string[] = [];
  const over =
    input.poolOverFunding.gt(BONUS_POOL_ZERO) || input.releaseTypes.includes('OVER_FUNDING');
  if (over) {
    labels.push(WALLET_FUNDING_LABEL.OVER_FUNDING);
  }
  if (input.releaseTypes.includes('EXTRA')) {
    labels.push(WALLET_FUNDING_LABEL.EXTRA_BONUS);
  }
  if (input.releaseTypes.includes('EARLY')) {
    labels.push(WALLET_FUNDING_LABEL.EARLY_RELEASE);
  }
  const partialEmployee =
    input.employeeReleased.gt(BONUS_POOL_ZERO) && input.employeeRemaining.gt(BONUS_POOL_ZERO);
  if (partialEmployee || input.poolStatus === 'PARTIALLY_RELEASED') {
    labels.push(WALLET_FUNDING_LABEL.PARTIAL);
  }
  if (labels.length === 0) {
    labels.push(WALLET_FUNDING_LABEL.WITHIN_POOL);
  }
  return labels;
}

function payoutStateFor(paid: Decimal, remaining: Decimal): 'UNPAID' | 'PARTIAL' | 'PAID' {
  if (paid.gt(BONUS_POOL_ZERO) && remaining.gt(BONUS_POOL_ZERO)) {
    return 'PARTIAL';
  }
  if (remaining.equals(BONUS_POOL_ZERO) && paid.gt(BONUS_POOL_ZERO)) {
    return 'PAID';
  }
  return 'UNPAID';
}

function uniqueSorted(values: string[]): string {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b)).join(', ');
}

function releaseTypesForEntries(
  entryIds: Set<string>,
  releases: WalletReleaseTypeRow[],
): BonusReleaseTypeEnum[] {
  const out: BonusReleaseTypeEnum[] = [];
  for (const r of releases) {
    if (!entryIds.has(r.bonusEntryId)) continue;
    if (!COUNTING.has(r.status)) continue;
    out.push(r.releaseType);
  }
  return out;
}

/** Builds one breakdown row per distinct order that has bonus entries for the employee. */
export function buildEmployeeWalletProjectBreakdown(
  entries: WalletBonusEntryForBreakdown[],
  rollups: Map<string, WalletReleaseRollup>,
  releases: WalletReleaseTypeRow[],
  poolByOrderId: Map<string, WalletPoolForBreakdown>,
): EmployeeWalletProjectBreakdownRow[] {
  const byOrder = new Map<string, WalletBonusEntryForBreakdown[]>();
  for (const e of entries) {
    const list = byOrder.get(e.orderId) ?? [];
    list.push(e);
    byOrder.set(e.orderId, list);
  }

  const rows: EmployeeWalletProjectBreakdownRow[] = [];
  for (const [orderId, list] of byOrder) {
    const first = list[0];
    let planned = BONUS_POOL_ZERO;
    let released = BONUS_POOL_ZERO;
    let paid = BONUS_POOL_ZERO;
    let remaining = BONUS_POOL_ZERO;
    const entryIds = new Set<string>();
    const types: string[] = [];
    const statuses: string[] = [];
    for (const e of list) {
      entryIds.add(e.id);
      types.push(e.type);
      statuses.push(e.status);
      const r = rollups.get(e.id);
      planned = planned.add(e.amount);
      released = released.add(r?.releasedAmount ?? BONUS_POOL_ZERO);
      paid = paid.add(r?.paidAmount ?? BONUS_POOL_ZERO);
      remaining = remaining.add(r?.remainingAmount ?? e.amount);
    }
    const pool = poolByOrderId.get(orderId);
    const rtypes = releaseTypesForEntries(entryIds, releases);
    const fundingStatusLabels = deriveWalletOrderFundingLabels({
      poolOverFunding: pool?.overFundingAmount ?? BONUS_POOL_ZERO,
      releaseTypes: rtypes,
      poolStatus: pool?.status ?? null,
      employeeReleased: released,
      employeeRemaining: remaining,
    });
    rows.push({
      orderId,
      projectId: first.projectId,
      project: { code: first.project.code, name: first.project.name },
      order: { code: first.order.code },
      productLabel: formatProductLabel(pool, first.order.code),
      bonusTypesSummary: uniqueSorted(types),
      plannedBonus: planned.toFixed(2),
      releasedBonus: released.toFixed(2),
      paidBonus: paid.toFixed(2),
      remainingBonus: remaining.toFixed(2),
      fundingStatusLabels,
      poolAvailableFunding: pool ? pool.availableFunding.toFixed(2) : null,
      poolOverFunding: pool ? pool.overFundingAmount.toFixed(2) : null,
      entryStatusesSummary: uniqueSorted(statuses),
      payoutState: payoutStateFor(paid, remaining),
    });
  }

  rows.sort((a, b) => {
    const pc = a.project.code.localeCompare(b.project.code);
    if (pc !== 0) return pc;
    return a.order.code.localeCompare(b.order.code);
  });
  return rows;
}
