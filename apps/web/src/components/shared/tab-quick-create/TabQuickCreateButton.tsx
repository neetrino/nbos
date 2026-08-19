'use client';

import type { MouseEvent } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TAB_QUICK_CREATE_BUTTON_CLASS,
  TAB_QUICK_CREATE_ICON_SIZE_PX,
  TAB_QUICK_CREATE_SLOT_CLASS,
} from './tab-quick-create.constants';

export function stopTabQuickCreateClick(
  event: Pick<MouseEvent, 'preventDefault' | 'stopPropagation'>,
  onCreate: () => void,
): void {
  event.preventDefault();
  event.stopPropagation();
  onCreate();
}

interface TabQuickCreateButtonProps {
  ariaLabel: string;
  onCreate: () => void;
  disabled?: boolean;
}

/** Hover/focus plus shortcut on entity detail sheet tabs (right of label). */
export function TabQuickCreateButton({
  ariaLabel,
  onCreate,
  disabled = false,
}: TabQuickCreateButtonProps) {
  return (
    <span className={TAB_QUICK_CREATE_SLOT_CLASS} aria-hidden={disabled}>
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        disabled={disabled}
        className={cn(TAB_QUICK_CREATE_BUTTON_CLASS, disabled && 'opacity-0')}
        onClick={(event) => stopTabQuickCreateClick(event, onCreate)}
      >
        <Plus size={TAB_QUICK_CREATE_ICON_SIZE_PX} aria-hidden />
      </button>
    </span>
  );
}
