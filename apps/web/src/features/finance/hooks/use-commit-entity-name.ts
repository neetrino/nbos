'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';

interface UseCommitEntityNameOptions<T> {
  enabled: boolean;
  save: (name: string) => Promise<T>;
  onSaved: (entity: T) => void;
  successMessage: string;
  errorMessage: string;
}

/**
 * Saves an inline title and rethrows so the editor stays open after a failure.
 */
export function useCommitEntityName<T>({
  enabled,
  save,
  onSaved,
  successMessage,
  errorMessage,
}: UseCommitEntityNameOptions<T>) {
  return useCallback(
    async (name: string) => {
      if (!enabled) return;
      try {
        const updated = await save(name);
        onSaved(updated);
        toast.success(successMessage);
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, errorMessage));
        throw caught;
      }
    },
    [enabled, errorMessage, onSaved, save, successMessage],
  );
}
