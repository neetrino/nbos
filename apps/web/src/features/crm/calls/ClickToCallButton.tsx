'use client';

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/lib/permissions';
import type { ClickToCallTargetType } from '@/lib/api/calls';
import {
  canShowClickToCallButton,
  clickToCallButtonLabel,
  hasClickToCallPermission,
} from './click-to-call-status';
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
  const { state, start } = useClickToCall();
  const visible = canShowClickToCallButton({
    hidden,
    canCreate: hasClickToCallPermission(can, targetType),
  });
  if (!visible) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant={state === 'error' ? 'destructive' : 'outline'}
      disabled={state === 'loading'}
      aria-busy={state === 'loading'}
      aria-label={clickToCallButtonLabel(state)}
      onClick={() => void start({ targetType, targetId })}
    >
      <Phone size={14} className="mr-1" />
      {clickToCallButtonLabel(state)}
    </Button>
  );
}
