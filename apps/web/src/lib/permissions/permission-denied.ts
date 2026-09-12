import { toast } from 'sonner';
import {
  getApiErrorMessage,
  isPermissionDeniedApiError,
  PERMISSION_DENIED_MESSAGE,
} from '@/lib/api-errors';

export const PERMISSION_DENIED_TOAST_ID = 'nbos-permission-denied';

let permissionDeniedCopy = PERMISSION_DENIED_MESSAGE;

/** Keeps the global 403 toast on the active interface locale. */
export function setPermissionDeniedCopy(message: string): void {
  const trimmed = message.trim();
  if (trimmed.length === 0) return;
  permissionDeniedCopy = trimmed;
}

export function notifyPermissionDenied(): void {
  if (typeof window === 'undefined') return;
  toast.error(permissionDeniedCopy, { id: PERMISSION_DENIED_TOAST_ID });
}

export function beginPermittedCreate(allowed: boolean, open: () => void): void {
  if (!allowed) {
    notifyPermissionDenied();
    return;
  }
  open();
}

/** Skips 403 — the API interceptor already toasts permission denials. */
export function toastApiError(caught: unknown, fallback: string): void {
  if (isPermissionDeniedApiError(caught)) return;
  toast.error(getApiErrorMessage(caught, fallback));
}
