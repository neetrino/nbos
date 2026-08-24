'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/lib/permissions';
import type { ClickToCallTargetType } from '@/lib/api/calls';
import {
  canShowClickToCallButton,
  CLICK_TO_CALL_NEW_CALL_LABEL,
  clickToCallButtonLabel,
  clickToCallButtonVariant,
  hasClickToCallPermission,
} from './click-to-call-status';
import {
  hasStoredClickToCallIdempotencyKey,
  subscribeClickToCallKeyChanges,
} from './click-to-call-idempotency-key';
import { useClickToCall } from './use-click-to-call';

interface ClickToCallButtonProps {
  targetType: ClickToCallTargetType;
  targetId: string;
  hidden?: boolean;
}

export function ClickToCallButton({
  targetType,
  targetId,
  hidden = false,
}: ClickToCallButtonProps) {
  const { can } = usePermission();
  const { state, start, startNewCall } = useClickToCall();
  const readPendingKey = useCallback(
    () => hasStoredClickToCallIdempotencyKey(sessionStorage, targetType, targetId),
    [targetId, targetType],
  );
  const hasPendingKey = useSyncExternalStore(
    subscribeClickToCallKeyChanges,
    readPendingKey,
    serverPendingKeySnapshot,
  );
  const visible = canShowClickToCallButton({
    hidden,
    canCreate: hasClickToCallPermission(can, targetType),
  });
  if (!visible) return null;

  return (
    <span className="inline-flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        className="rounded-full shadow-sm"
        variant={clickToCallButtonVariant(state)}
        disabled={state === 'loading'}
        aria-busy={state === 'loading'}
        aria-label={clickToCallButtonLabel(state)}
        onClick={() => void start({ targetType, targetId })}
      >
        <Phone
          size={14}
          className={
            state === 'success' || state === 'loading' ? 'nbos-animate-pulse-soft' : undefined
          }
        />
        {clickToCallButtonLabel(state)}
      </Button>
      {hasPendingKey ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={state === 'loading'}
          aria-label={CLICK_TO_CALL_NEW_CALL_LABEL}
          onClick={() => void startNewCall({ targetType, targetId })}
        >
          {CLICK_TO_CALL_NEW_CALL_LABEL}
        </Button>
      ) : null}
    </span>
  );
}

function serverPendingKeySnapshot(): boolean {
  return false;
}
