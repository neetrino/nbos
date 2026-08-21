'use client';

import { useCallback, useState } from 'react';
import { callsApi, type ClickToCallTargetType } from '@/lib/api/calls';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import type { ClickToCallUiState } from './click-to-call-status';

export function useClickToCall() {
  const [state, setState] = useState<ClickToCallUiState>('idle');

  const start = useCallback(
    async (input: { targetType: ClickToCallTargetType; targetId: string }) => {
      setState('loading');
      try {
        await callsApi.startClickToCall(input);
        setState('success');
      } catch (caught) {
        setState('error');
        toast.error(getApiErrorMessage(caught, 'Ошибка запуска звонка'));
      }
    },
    [],
  );

  return { state, start };
}
