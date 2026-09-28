import { Decimal } from '@nbos/database';

const MONEY_DECIMAL_PLACES = 2;
const PERCENT_DIVISOR = new Decimal(100);
const ZERO = roundMoney(new Decimal('0'));

/** Two-place AMD rounding used for every expected amount in this file. */
function roundMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

function money(value: string): Decimal {
  return roundMoney(new Decimal(value));
}

function sumMoney(parts: readonly Decimal[]): Decimal {
  return roundMoney(parts.reduce((total, part) => total.plus(part), ZERO));
}

function remainingOf(planned: Decimal, spent: Decimal): Decimal {
  return roundMoney(Decimal.max(ZERO, planned.minus(spent)));
}

function roleUncapped(base: Decimal, percent: Decimal): Decimal {
  return base.mul(percent).div(PERCENT_DIVISOR);
}

function splitCappedRoles(
  sellerUncapped: Decimal,
  assistantUncapped: Decimal,
  cap: Decimal,
): { seller: Decimal; assistant: Decimal; combined: Decimal; excess: Decimal } {
  const combined = sellerUncapped.plus(assistantUncapped);
  if (!combined.gt(cap)) {
    const seller = roundMoney(sellerUncapped);
    const assistant = roundMoney(assistantUncapped);
    return { seller, assistant, combined: roundMoney(seller.plus(assistant)), excess: ZERO };
  }
  const seller = roundMoney(sellerUncapped.div(combined).mul(cap));
  const assistant = roundMoney(Decimal.max(ZERO, cap.minus(seller)));
  return {
    seller,
    assistant,
    combined: roundMoney(seller.plus(assistant)),
    excess: remainingOf(combined, cap),
  };
}

function ordinaryFromCell(cell: Decimal, remaining: Decimal): Decimal {
  return roundMoney(Decimal.min(cell, remaining));
}

function extraOverRemaining(cell: Decimal, remaining: Decimal): Decimal {
  return remainingOf(cell, remaining);
}

/** Classic invoice 210,000 paid 100,000 then 100,000 then 10,000. */
export const P6_S2_INVOICE_AMOUNT = money('210000');
export const P6_S2_INVOICE_RECEIPT_1 = money('100000');
export const P6_S2_INVOICE_RECEIPT_2 = money('100000');
export const P6_S2_INVOICE_RECEIPT_3 = money('10000');
export const P6_S2_INVOICE_PAID_AFTER_1 = P6_S2_INVOICE_RECEIPT_1;
export const P6_S2_INVOICE_REMAINING_AFTER_1 = remainingOf(
  P6_S2_INVOICE_AMOUNT,
  P6_S2_INVOICE_PAID_AFTER_1,
);
export const P6_S2_INVOICE_ACCRUAL_AFTER_1 = ZERO;
export const P6_S2_INVOICE_PAID_AFTER_2 = sumMoney([
  P6_S2_INVOICE_RECEIPT_1,
  P6_S2_INVOICE_RECEIPT_2,
]);
export const P6_S2_INVOICE_REMAINING_AFTER_2 = remainingOf(
  P6_S2_INVOICE_AMOUNT,
  P6_S2_INVOICE_PAID_AFTER_2,
);
export const P6_S2_INVOICE_ACCRUAL_AFTER_2 = ZERO;
export const P6_S2_INVOICE_PAID_AFTER_FINAL = sumMoney([
  P6_S2_INVOICE_RECEIPT_1,
  P6_S2_INVOICE_RECEIPT_2,
  P6_S2_INVOICE_RECEIPT_3,
]);
export const P6_S2_INVOICE_REMAINING_AFTER_FINAL = remainingOf(
  P6_S2_INVOICE_AMOUNT,
  P6_S2_INVOICE_PAID_AFTER_FINAL,
);

/**
 * Documented Sales 8:2 illustration on a 10,000,000 order (V-09 / BR-30).
 * Not a Delivery rate and not a KPI target.
 */
export const P6_S2_ORDER_BASE = money('10000000');
export const P6_S2_SELLER_PERCENT = new Decimal('8');
export const P6_S2_ASSISTANT_PERCENT = new Decimal('2');
export const P6_S2_ORDER_CAP = money('300000');

const CAP_SPLIT = splitCappedRoles(
  roleUncapped(P6_S2_ORDER_BASE, P6_S2_SELLER_PERCENT),
  roleUncapped(P6_S2_ORDER_BASE, P6_S2_ASSISTANT_PERCENT),
  P6_S2_ORDER_CAP,
);

export const P6_S2_CAP_SELLER = CAP_SPLIT.seller;
export const P6_S2_CAP_ASSISTANT = CAP_SPLIT.assistant;
export const P6_S2_CAP_COMBINED = CAP_SPLIT.combined;
export const P6_S2_CAP_EXCESS = CAP_SPLIT.excess;
export const P6_S2_CAP_REMAINING_ENVELOPE = remainingOf(P6_S2_ORDER_CAP, P6_S2_CAP_COMBINED);
export const P6_S2_SAME_PERSON_TOTAL = roundMoney(P6_S2_CAP_SELLER.plus(P6_S2_CAP_ASSISTANT));

const INVOICE_ACCRUAL_SPLIT = splitCappedRoles(
  roleUncapped(P6_S2_INVOICE_AMOUNT, P6_S2_SELLER_PERCENT),
  roleUncapped(P6_S2_INVOICE_AMOUNT, P6_S2_ASSISTANT_PERCENT),
  P6_S2_ORDER_CAP,
);
export const P6_S2_INVOICE_SELLER = INVOICE_ACCRUAL_SPLIT.seller;
export const P6_S2_INVOICE_ASSISTANT = INVOICE_ACCRUAL_SPLIT.assistant;
export const P6_S2_INVOICE_COMBINED = INVOICE_ACCRUAL_SPLIT.combined;

/** Development plan 200,000 released 40,000 then 10,000 then 120,000. */
export const P6_S2_DEV_PLAN = money('200000');
export const P6_S2_DEV_RELEASE_1 = money('40000');
export const P6_S2_DEV_RELEASE_2 = money('10000');
export const P6_S2_DEV_RELEASE_3 = money('120000');
export const P6_S2_DEV_ORDINARY_RELEASED = sumMoney([
  P6_S2_DEV_RELEASE_1,
  P6_S2_DEV_RELEASE_2,
  P6_S2_DEV_RELEASE_3,
]);
export const P6_S2_DEV_ORDINARY_REMAINING = remainingOf(
  P6_S2_DEV_PLAN,
  P6_S2_DEV_ORDINARY_RELEASED,
);
export const P6_S2_DEV_REJECTED_ORDINARY = money('40000');
export const P6_S2_DEV_EXTRA = money('30000');
export const P6_S2_DEV_OVERFLOW_CELL = money('60000');
export const P6_S2_DEV_OVERFLOW_ORDINARY = ordinaryFromCell(
  P6_S2_DEV_OVERFLOW_CELL,
  P6_S2_DEV_ORDINARY_REMAINING,
);
export const P6_S2_DEV_OVERFLOW_EXTRA = extraOverRemaining(
  P6_S2_DEV_OVERFLOW_CELL,
  P6_S2_DEV_ORDINARY_REMAINING,
);
export const P6_S2_DEV_EXTRA_WHEN_REMAINING_ZERO = extraOverRemaining(P6_S2_DEV_EXTRA, ZERO);
export const P6_S2_DEV_PLAN_AFTER_EXTRA = P6_S2_DEV_PLAN;
export const P6_S2_DEV_DRAFT = money('40000');
export const P6_S2_DEV_REMAINING_WITH_DRAFT = P6_S2_DEV_ORDINARY_REMAINING;

/** Salary remaining 300,000, included bonus 60,000, cash 320,000. */
export const P6_S2_SALARY_REMAINING = money('300000');
export const P6_S2_INCLUDED_BONUS = money('60000');
export const P6_S2_CASH = money('320000');
export const P6_S2_SALARY_PAID = roundMoney(Decimal.min(P6_S2_CASH, P6_S2_SALARY_REMAINING));
export const P6_S2_NAMED_BONUS_PAID = remainingOf(P6_S2_CASH, P6_S2_SALARY_PAID);
export const P6_S2_SALARY_REMAINING_AFTER = remainingOf(P6_S2_SALARY_REMAINING, P6_S2_SALARY_PAID);
export const P6_S2_BONUS_REMAINING = remainingOf(P6_S2_INCLUDED_BONUS, P6_S2_NAMED_BONUS_PAID);
export const P6_S2_EXPENSE_TOTAL = roundMoney(P6_S2_SALARY_REMAINING.plus(P6_S2_INCLUDED_BONUS));
export const P6_S2_EXPENSE_REMAINING = remainingOf(P6_S2_EXPENSE_TOTAL, P6_S2_CASH);
export const P6_S2_EXPENSE_FULLY_PAID = P6_S2_EXPENSE_REMAINING.lte(ZERO);
