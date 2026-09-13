'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { callsApi, type ClickToCallTargetType } from '@/lib/api/calls';
import { ApiError, getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { useActiveCall } from './ActiveCallProvider';
import { CLICK_TO_CALL_ERROR_LABEL_KEY, type ClickToCallUiState } from './click-to-call-status';
import {
  clearClickToCallIdempotencyKey,
  CLICK_TO_CALL_NEW_CALL_WARNING_KEY,
  nextClickToCallIdempotencyKey,
  requestNewClickToCallKey,
  shouldKeepClickToCallIdempotencyKey,
} from './click-to-call-idempotency-key';

export function useClickToCall() {
  const t = useTranslations('crm');
  const [state, setState] = useState<ClickToCallUiState>('idle');
  const { openCall } = useActiveCall();

  const start = useCallback(
    async (input: { targetType: ClickToCallTargetType; targetId: string }) => {
      setState('loading');
      const key = nextClickToCallIdempotencyKey(
        sessionStorage,
        input.targetType,
        input.targetId,
        () => crypto.randomUUID(),
      );
      try {
        const call = await callsApi.startClickToCall(input, key);
        clearClickToCallIdempotencyKey(sessionStorage, input.targetType, input.targetId);
        openCall({
          callId: call.id,
          uid: call.uid,
          direction: call.direction,
          phone: call.phone,
          displayName: call.contactName || call.leadName || call.phone,
        });
        setState('success');
      } catch (caught) {
        if (!shouldKeepClickToCallIdempotencyKey(statusOf(caught))) {
          clearClickToCallIdempotencyKey(sessionStorage, input.targetType, input.targetId);
        }
        setState('error');
        toast.error(getApiErrorMessage(caught, t(CLICK_TO_CALL_ERROR_LABEL_KEY as never)));
      }
    },
    [openCall, t],
  );

  const startNewCall = useCallback(
    async (input: { targetType: ClickToCallTargetType; targetId: string }) => {
      const confirmed = requestNewClickToCallKey(
        sessionStorage,
        input.targetType,
        input.targetId,
        (message) => window.confirm(message),
        t(CLICK_TO_CALL_NEW_CALL_WARNING_KEY as never),
      );
      if (!confirmed) return;
      await start(input);
    },
    [start, t],
  );

  return { state, start, startNewCall };
}

function statusOf(caught: unknown): number | undefined {
  return caught instanceof ApiError ? caught.statusCode : undefined;
}
