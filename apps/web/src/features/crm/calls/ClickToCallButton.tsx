'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { usePermission } from '@/lib/permissions';
import type { ClickToCallTargetType } from '@/lib/api/calls';
import {
  canShowClickToCallButton,
  clickToCallButtonLabelKey,
  clickToCallButtonVariant,
  hasClickToCallPermission,
  type ClickToCallUiState,
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

function useClickToCallVisibility(params: ClickToCallButtonProps) {
  const { targetType, targetId, hidden = false } = params;
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
  return { visible, state, start, startNewCall, hasPendingKey, targetType, targetId };
}

export function ClickToCallButton(props: ClickToCallButtonProps) {
  const t = useTranslations('crm');
  const { visible, state, start, startNewCall, hasPendingKey, targetType, targetId } =
    useClickToCallVisibility(props);
  if (!visible) return null;
  const label = t(clickToCallButtonLabelKey(state) as never);
  const newCallLabel = t('calls.newCall');

  return (
    <span className="inline-flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        className="rounded-full shadow-sm"
        variant={clickToCallButtonVariant(state)}
        disabled={state === 'loading'}
        aria-busy={state === 'loading'}
        aria-label={label}
        onClick={() => void start({ targetType, targetId })}
      >
        <Phone
          size={14}
          className={
            state === 'success' || state === 'loading' ? 'nbos-animate-pulse-soft' : undefined
          }
        />
        {label}
      </Button>
      {hasPendingKey ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={state === 'loading'}
          aria-label={newCallLabel}
          onClick={() => void startNewCall({ targetType, targetId })}
        >
          {newCallLabel}
        </Button>
      ) : null}
    </span>
  );
}

/** Settings-menu items for the same click-to-call actions as {@link ClickToCallButton}. */
export function ClickToCallMenuItems(props: ClickToCallButtonProps) {
  const t = useTranslations('crm');
  const { visible, state, start, startNewCall, hasPendingKey, targetType, targetId } =
    useClickToCallVisibility(props);
  if (!visible) return null;

  return (
    <>
      <DropdownMenuItem
        disabled={state === 'loading'}
        onClick={() => void start({ targetType, targetId })}
      >
        <Phone />
        {t(clickToCallButtonLabelKey(state) as never)}
      </DropdownMenuItem>
      {hasPendingKey ? (
        <DropdownMenuItem
          disabled={state === 'loading'}
          onClick={() => void startNewCall({ targetType, targetId })}
        >
          <Phone />
          {t('calls.newCall')}
        </DropdownMenuItem>
      ) : null}
    </>
  );
}

function serverPendingKeySnapshot(): boolean {
  return false;
}
