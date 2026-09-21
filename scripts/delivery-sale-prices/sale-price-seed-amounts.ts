/** Ordinary catalog work. The Owner's starting AMD-per-unit rate for non-AI functions. */
export const STANDARD_SALE_AMOUNT_PER_UNIT = '10000';

/** AI cards sell at a premium; development units stay ordinary. */
export const AI_SALE_AMOUNT_PER_UNIT = '20000';

export const AI_FUNCTION_CATEGORY = 'ai';

export function saleAmountForCategory(category: string): string {
  return category === AI_FUNCTION_CATEGORY
    ? AI_SALE_AMOUNT_PER_UNIT
    : STANDARD_SALE_AMOUNT_PER_UNIT;
}
