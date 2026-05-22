import { describe, it, expect } from 'vitest';
import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import {
  WALLET_FUNDING_LABEL,
  buildEmployeeWalletProjectBreakdown,
  deriveWalletOrderFundingLabels,
  walletBonusScopeLabel,
} from './employee-wallet-project-breakdown';
import type { WalletReleaseRollup } from './employee-wallet-bonus-release-rollups';

describe('walletBonusScopeLabel', () => {
  it('prefers product name from pool', () => {
    expect(
      walletBonusScopeLabel(
        {
          orderId: 'o',
          availableFunding: BONUS_POOL_ZERO,
          overFundingAmount: BONUS_POOL_ZERO,
          totalPlannedAmount: BONUS_POOL_ZERO,
          totalReleasedAmount: BONUS_POOL_ZERO,
          status: 'ACTIVE',
          productName: 'Site build',
          extensionName: null,
        },
        'ORD-1',
      ),
    ).toBe('Site build');
  });

  it('falls back to order code when pool missing', () => {
    expect(walletBonusScopeLabel(undefined, 'ORD-9')).toBe('Order ORD-9');
  });
});

describe('deriveWalletOrderFundingLabels', () => {
  it('returns Within Pool when no exceptions', () => {
    expect(
      deriveWalletOrderFundingLabels({
        poolOverFunding: BONUS_POOL_ZERO,
        releaseTypes: ['AUTO'],
        poolStatus: 'ACTIVE',
        employeeReleased: BONUS_POOL_ZERO,
        employeeRemaining: new Decimal(100),
      }),
    ).toEqual([WALLET_FUNDING_LABEL.WITHIN_POOL]);
  });

  it('flags Over Funding from pool amount', () => {
    expect(
      deriveWalletOrderFundingLabels({
        poolOverFunding: new Decimal(1),
        releaseTypes: [],
        poolStatus: 'ACTIVE',
        employeeReleased: BONUS_POOL_ZERO,
        employeeRemaining: new Decimal(50),
      }),
    ).toContain(WALLET_FUNDING_LABEL.OVER_FUNDING);
  });

  it('flags release types EXTRA and EARLY', () => {
    const labels = deriveWalletOrderFundingLabels({
      poolOverFunding: BONUS_POOL_ZERO,
      releaseTypes: ['EXTRA', 'EARLY'],
      poolStatus: 'ACTIVE',
      employeeReleased: BONUS_POOL_ZERO,
      employeeRemaining: new Decimal(10),
    });
    expect(labels).toContain(WALLET_FUNDING_LABEL.EXTRA_BONUS);
    expect(labels).toContain(WALLET_FUNDING_LABEL.EARLY_RELEASE);
  });

  it('adds Partial when employee has released and remaining', () => {
    expect(
      deriveWalletOrderFundingLabels({
        poolOverFunding: BONUS_POOL_ZERO,
        releaseTypes: ['AUTO'],
        poolStatus: 'ACTIVE',
        employeeReleased: new Decimal(20),
        employeeRemaining: new Decimal(30),
      }),
    ).toContain(WALLET_FUNDING_LABEL.PARTIAL);
  });
});

describe('buildEmployeeWalletProjectBreakdown', () => {
  it('aggregates one order and sorts by project/order codes', () => {
    const rollups = new Map<string, WalletReleaseRollup>([
      [
        'b1',
        {
          releasedAmount: new Decimal(100),
          paidAmount: new Decimal(100),
          remainingAmount: BONUS_POOL_ZERO,
          kpiBurnedAmount: BONUS_POOL_ZERO,
          payrollMonth: '2026-01',
        },
      ],
    ]);
    const rows = buildEmployeeWalletProjectBreakdown(
      [
        {
          id: 'b1',
          orderId: 'o1',
          projectId: 'p1',
          type: 'DELIVERY',
          status: 'PAID',
          amount: new Decimal(100),
          project: { code: 'Z', name: 'Zeta' },
          order: { code: 'O99' },
        },
      ],
      rollups,
      [
        {
          bonusEntryId: 'b1',
          releaseType: 'AUTO',
          status: 'PAID',
        },
      ],
      new Map(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].projectId).toBe('p1');
    expect(rows[0].plannedBonus).toBe('100.00');
    expect(rows[0].payoutState).toBe('PAID');
    expect(rows[0].productLabel).toBe('Order O99');
  });
});
