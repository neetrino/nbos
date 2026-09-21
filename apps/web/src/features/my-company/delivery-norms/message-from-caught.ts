import { CatalogContentValidationError } from '@nbos/shared';
import { getApiErrorMessage } from '@/lib/api-errors';

export function messageFromCaught(caught: unknown, fallback: string): string {
  if (caught instanceof CatalogContentValidationError) {
    return caught.message;
  }
  return getApiErrorMessage(caught, fallback);
}
