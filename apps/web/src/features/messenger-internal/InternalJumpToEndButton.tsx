'use client';

import { ChevronDown } from 'lucide-react';
import { SHEET_JUMP_TO_END_BUTTON_CLASS } from './internal-messenger.constants';

export function InternalJumpToEndButton({
  visible,
  onJump,
}: {
  visible: boolean;
  onJump: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Scroll to latest messages"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={onJump}
      className={`${SHEET_JUMP_TO_END_BUTTON_CLASS} ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ChevronDown size={22} aria-hidden />
    </button>
  );
}
