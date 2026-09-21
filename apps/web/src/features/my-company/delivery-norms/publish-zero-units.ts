import {
  hasExplicitZeroRequiredUnits,
  type DeliveryRoleUnitFinancialDto,
  type DeliveryRoleUnitInput,
} from '@nbos/shared';
import { ApiError } from '@/lib/api-errors';
import { ZERO_UNITS_CONFIRMATION_MESSAGE } from './delivery-norms.constants';

type VectorRow = DeliveryRoleUnitInput | DeliveryRoleUnitFinancialDto;

export function needsZeroUnitsPublishConfirmation(rows: readonly VectorRow[]): boolean {
  return hasExplicitZeroRequiredUnits(rows);
}

export function isZeroUnitsConfirmationError(caught: unknown): boolean {
  if (!(caught instanceof ApiError)) {
    return false;
  }
  return (
    caught.code === ZERO_UNITS_CONFIRMATION_MESSAGE ||
    caught.message === ZERO_UNITS_CONFIRMATION_MESSAGE
  );
}

export async function publishWithZeroUnitsConfirmation<T>(
  rows: readonly VectorRow[],
  confirmMessage: string,
  publish: (confirmZeroUnits: boolean) => Promise<T>,
  confirm: (message: string) => boolean = defaultConfirm,
): Promise<T | 'cancelled'> {
  const needsConfirm = needsZeroUnitsPublishConfirmation(rows);
  const confirmedUpFront = needsConfirm ? confirm(confirmMessage) : false;
  if (needsConfirm && !confirmedUpFront) {
    return 'cancelled';
  }
  try {
    return await publish(confirmedUpFront);
  } catch (caught) {
    if (confirmedUpFront || !isZeroUnitsConfirmationError(caught)) {
      throw caught;
    }
    if (!confirm(confirmMessage)) {
      return 'cancelled';
    }
    return publish(true);
  }
}

function defaultConfirm(message: string): boolean {
  return globalThis.confirm(message);
}
