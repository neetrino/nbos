'use client';

import { useCallback, useState } from 'react';
import { callsApi, type ClickToCallTargetType } from '@/lib/api/calls';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { useActiveCall } from './ActiveCallProvider';
import type { ClickToCallUiState } from './click-to-call-status';

export function useClickToCall() {
  const [state, setState] = useState<ClickToCallUiState>('idle');
  const { openCall } = useActiveCall();

  const start = useCallback(
    async (input: { targetType: ClickToCallTargetType; targetId: string }) => {
      setState('loading');
      try {
        const call = await callsApi.startClickToCall(input);
        openCall({
          callId: call.id,
          uid: call.uid,
          direction: call.direction,
          phone: call.phone,
          displayName: call.contactName || call.leadName || call.phone,
        });
        setState('success');
      } catch (caught) {
        setState('error');
        toast.error(getApiErrorMessage(caught, 'Ошибка запуска звонка'));
      }
    },
    [openCall],
  );

  return { state, start };
}
