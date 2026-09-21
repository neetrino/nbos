import {
  DELIVERY_MONEY_SCALE,
  DELIVERY_SHARE_PERCENT_SCALE,
  DELIVERY_SHARE_PERCENT_TOTAL,
} from './constants';
import {
  DeliveryDecimalError,
  multiplyScaled,
  parseScaledDecimal,
  quantizeScaled,
  scaledToString,
  sumMoney,
} from './decimal-scale';

export type ShareInput = {
  key: string;
  percent: string;
};

export type ShareAllocation = {
  key: string;
  percent: string;
  amount: string;
};

const PERCENT_TOTAL = parseScaledDecimal(
  String(DELIVERY_SHARE_PERCENT_TOTAL),
  DELIVERY_SHARE_PERCENT_SCALE,
);

export function allocateShares(
  totalAmount: string,
  shares: readonly ShareInput[],
): ShareAllocation[] {
  if (shares.length === 0) {
    return [];
  }
  const parsed = parseSharePercents(shares);
  const total = parseScaledDecimal(totalAmount, DELIVERY_MONEY_SCALE);
  const ordered = [...parsed].sort((left, right) => left.share.key.localeCompare(right.share.key));
  const allocated: ShareAllocation[] = [];
  let assigned = 0n;

  for (let index = 0; index < ordered.length; index += 1) {
    const row = ordered[index];
    if (!row) continue;
    if (index === ordered.length - 1) {
      allocated.push({
        key: row.share.key,
        percent: row.share.percent,
        amount: scaledToString({
          value: total.value - assigned,
          scale: DELIVERY_MONEY_SCALE,
        }),
      });
      break;
    }
    const portion = portionOfTotal(total, row.percent);
    assigned += portion.value;
    allocated.push({
      key: row.share.key,
      percent: row.share.percent,
      amount: scaledToString(portion),
    });
  }

  return allocated;
}

export function assertShareSumMatchesTotal(
  totalAmount: string,
  allocations: readonly ShareAllocation[],
): boolean {
  return sumMoney(allocations.map((row) => row.amount)) === totalAmount;
}

export function percentOfAmount(part: string, total: string): string {
  const partScaled = parseScaledDecimal(part, DELIVERY_MONEY_SCALE);
  const totalScaled = parseScaledDecimal(total, DELIVERY_MONEY_SCALE);
  if (totalScaled.value === 0n) {
    return scaledToString({ value: 0n, scale: DELIVERY_SHARE_PERCENT_SCALE });
  }
  const value =
    (partScaled.value *
      BigInt(DELIVERY_SHARE_PERCENT_TOTAL) *
      10n ** BigInt(DELIVERY_SHARE_PERCENT_SCALE)) /
    totalScaled.value;
  return scaledToString({ value, scale: DELIVERY_SHARE_PERCENT_SCALE });
}

function parseSharePercents(shares: readonly ShareInput[]) {
  try {
    const parsed = shares.map((share) => ({
      share,
      percent: parseScaledDecimal(share.percent, DELIVERY_SHARE_PERCENT_SCALE),
    }));
    if (parsed.some((row) => row.percent.value < 0n)) {
      throw new Error('INVALID_SHARE_PERCENT');
    }
    const percentSum = parsed.reduce((sum, row) => sum + row.percent.value, 0n);
    if (percentSum !== PERCENT_TOTAL.value) {
      throw new Error('SHARE_PERCENT_TOTAL');
    }
    return parsed;
  } catch (error) {
    if (error instanceof DeliveryDecimalError) {
      throw new Error('INVALID_SHARE_PERCENT');
    }
    throw error;
  }
}

function portionOfTotal(
  total: ReturnType<typeof parseScaledDecimal>,
  percent: ReturnType<typeof parseScaledDecimal>,
) {
  const product = multiplyScaled(total, percent);
  return quantizeScaled({ value: product.value, scale: product.scale + 2 }, DELIVERY_MONEY_SCALE);
}
