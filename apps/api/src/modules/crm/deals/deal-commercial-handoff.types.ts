export type DealExceptionType = 'FREE' | 'POSTPAID';

export interface DealCommercialActor {
  actorId?: string;
  actorRoleLevel?: number;
}

export interface CreateExceptionOrderBody {
  exceptionType: DealExceptionType;
  reason: string;
  paymentExpectedAt?: string | null;
}

export interface StartEarlyDeliveryBody {
  /** Optional note when starting delivery before deposit is paid. */
  note?: string | null;
}

export interface CreateDepositOrderBody {
  amount: number;
  dueDate?: string | null;
}

export const DEPOSIT_COMMERCIAL_DEAL_TYPES = new Set(['PRODUCT', 'EXTENSION', 'OUTSOURCE']);
export const PRIVILEGED_COMMERCIAL_ROLE_LEVEL = 2;
export const EXCEPTION_REASON_MIN_LEN = 10;
