import { BadRequestException } from '@nestjs/common';

/** Employee take-home is AMD only. No FX conversion and no relabeling. */
export const EMPLOYEE_TAKE_HOME_CURRENCY = 'AMD' as const;

export type EmployeeTakeHomeCurrency = typeof EMPLOYEE_TAKE_HOME_CURRENCY;

export function isEmployeeTakeHomeCurrency(
  currency: string | null | undefined,
): currency is EmployeeTakeHomeCurrency {
  return currency?.trim() === EMPLOYEE_TAKE_HOME_CURRENCY;
}

function displayedCurrency(currency: string | null | undefined): string {
  if (currency == null || currency.trim() === '') {
    return 'blank';
  }
  return currency.trim();
}

/**
 * Rejects USD, EUR, mixed, and blank values. Blank is not AMD.
 * Does not convert or rewrite a foreign currency to AMD.
 */
export function assertEmployeeTakeHomeCurrency(
  currency: string | null | undefined,
  context?: string,
): asserts currency is EmployeeTakeHomeCurrency {
  if (isEmployeeTakeHomeCurrency(currency)) {
    return;
  }
  const displayed = displayedCurrency(currency);
  const suffix = `employee take-home currency must be AMD, not ${displayed}`;
  throw new BadRequestException(context ? `${context}: ${suffix}` : capitalize(suffix));
}

function capitalize(message: string): string {
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/** Omitted currency is the AMD contract. Blank or foreign values are rejected. */
export function resolveCreateCompensationProfileCurrency(
  currency: string | undefined,
): EmployeeTakeHomeCurrency {
  if (currency === undefined) {
    return EMPLOYEE_TAKE_HOME_CURRENCY;
  }
  assertEmployeeTakeHomeCurrency(currency);
  return EMPLOYEE_TAKE_HOME_CURRENCY;
}

/** `undefined` leaves the stored currency unchanged. Blank or foreign values are rejected. */
export function resolvePatchCompensationProfileCurrency(
  currency: string | undefined,
): EmployeeTakeHomeCurrency | undefined {
  if (currency === undefined) {
    return undefined;
  }
  assertEmployeeTakeHomeCurrency(currency);
  return EMPLOYEE_TAKE_HOME_CURRENCY;
}
