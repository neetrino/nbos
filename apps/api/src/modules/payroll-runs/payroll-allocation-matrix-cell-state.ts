import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import type { PayrollMatrixCellState } from './payroll-allocation-matrix.types';

export function resolvePayrollMatrixCellState(params: {
  linked: boolean;
  hasBonusEntry: boolean;
  releaseAmount: ReturnType<typeof decimalFrom>;
  remaining: ReturnType<typeof decimalFrom>;
  availableFunding: ReturnType<typeof decimalFrom>;
  deliveryOpen: boolean;
  manualBonus: boolean;
}): PayrollMatrixCellState {
  if (!params.linked && params.releaseAmount.lte(BONUS_POOL_ZERO)) {
    return 'UNLINKED';
  }
  if (!params.hasBonusEntry && !params.manualBonus) {
    return params.linked ? 'LINKED_EMPTY' : 'UNLINKED';
  }
  if (params.hasBonusEntry && params.deliveryOpen && params.releaseAmount.lte(BONUS_POOL_ZERO)) {
    return 'LINKED_EMPTY';
  }
  if (
    params.availableFunding.gt(BONUS_POOL_ZERO) &&
    params.releaseAmount.gt(params.availableFunding)
  ) {
    return 'OVER_FUNDING';
  }
  if (params.manualBonus) {
    return 'MANUAL_BONUS';
  }
  if (params.releaseAmount.gt(params.remaining)) {
    return 'EXTRA_BONUS';
  }
  if (params.deliveryOpen) return 'PROGRESS';
  if (params.availableFunding.lt(params.remaining)) return 'PARTIALLY_FUNDED';
  return 'READY';
}
