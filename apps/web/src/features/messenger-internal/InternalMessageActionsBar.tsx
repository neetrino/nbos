'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { SHEET_ACTION_MENU_FADE_MS } from './internal-messenger.constants';
import { useSheetDialogFade } from './use-sheet-dialog-fade';
import {
  ClipboardCopy,
  CornerUpLeft,
  ExternalLink,
  Forward,
  ListTodo,
  Ticket,
  Link2,
  CircleCheck,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';
import { PORTAL_DROPDOWN_Z_CLASS } from '@/lib/overlay-z-index';

export type MessageActionMenuAnchor = { x: number; y: number; opensUp?: boolean };

export function InternalMessageActionsBar({
  anchor,
  onClose,
  canCreateTask,
  canCreateTicket = false,
  canLinkTicket = false,
  onReply,
  onForward,
  onCreateTask,
  onCreateTicket,
  onLinkTicket,
  onOpenOriginal,
  onCopySource,
  onSelect,
  onPin,
  onUnpin,
  onDelete,
}: {
  anchor: MessageActionMenuAnchor | null;
  onClose: () => void;
  canCreateTask: boolean;
  canCreateTicket?: boolean;
  canLinkTicket?: boolean;
  onReply: () => void;
  onForward: () => void;
  onCreateTask: () => void;
  onCreateTicket?: () => void;
  onLinkTicket?: () => void;
  onOpenOriginal: () => void;
  onCopySource: () => void;
  onSelect: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onDelete?: () => void;
}) {
  const open = Boolean(anchor);
  const { mounted, visible } = useSheetDialogFade(open, SHEET_ACTION_MENU_FADE_MS);
  const point = useHeldMenuAnchor(anchor);
  useDismissMessageMenu(open, onClose);
  if (!mounted || !point) return null;
  return (
    <div
      role="menu"
      className={menuMotionClass(visible, point.opensUp)}
      style={{ left: point.x, top: point.y }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <MenuRow
        icon={<CornerUpLeft size={16} />}
        label="Reply"
        onClick={() => run(onReply, onClose)}
      />
      <MenuRow
        icon={<Forward size={16} />}
        label="Forward"
        onClick={() => run(onForward, onClose)}
      />
      {canCreateTask ? (
        <MenuRow
          icon={<ListTodo size={16} />}
          label="Create Task"
          onClick={() => run(onCreateTask, onClose)}
        />
      ) : null}
      {canCreateTicket && onCreateTicket ? (
        <MenuRow
          icon={<Ticket size={16} />}
          label="Create Ticket"
          onClick={() => run(onCreateTicket, onClose)}
        />
      ) : null}
      {canLinkTicket && onLinkTicket ? (
        <MenuRow
          icon={<Link2 size={16} />}
          label="Link Ticket"
          onClick={() => run(onLinkTicket, onClose)}
        />
      ) : null}
      <MenuRow
        icon={<CircleCheck size={16} />}
        label="Select"
        onClick={() => run(onSelect, onClose)}
      />
      {onUnpin ? (
        <MenuRow icon={<PinOff size={16} />} label="Unpin" onClick={() => run(onUnpin, onClose)} />
      ) : onPin ? (
        <MenuRow icon={<Pin size={16} />} label="Pin" onClick={() => run(onPin, onClose)} />
      ) : null}
      <MenuDivider />
      <MenuRow
        icon={<ExternalLink size={16} />}
        label="Open original"
        onClick={() => run(onOpenOriginal, onClose)}
      />
      <MenuRow
        icon={<ClipboardCopy size={16} />}
        label="Copy source"
        onClick={() => run(onCopySource, onClose)}
      />
      {onDelete ? (
        <>
          <MenuDivider />
          <MenuRow
            icon={<Trash2 size={16} />}
            label="Delete"
            tone="danger"
            onClick={() => run(onDelete, onClose)}
          />
        </>
      ) : null}
    </div>
  );
}

function menuMotionClass(visible: boolean, opensUp?: boolean): string {
  const origin = opensUp ? 'origin-bottom-left' : 'origin-top-left';
  const motion = visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0';
  return `${PORTAL_DROPDOWN_Z_CLASS} ${origin} fixed min-w-56 overflow-hidden rounded-2xl bg-[#2b2b2b] text-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${motion}`;
}

function useHeldMenuAnchor(anchor: MessageActionMenuAnchor | null): MessageActionMenuAnchor | null {
  const [held, setHeld] = useState(anchor);
  if (anchor && held !== anchor) setHeld(anchor);
  return held;
}

function run(action: () => void, onClose: () => void): void {
  action();
  onClose();
}

function useDismissMessageMenu(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointer = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [open, onClose]);
}

function MenuRow({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}) {
  const danger = tone === 'danger';
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-white/10 ${
        danger ? 'text-[#fca5a5] hover:bg-white/10' : ''
      }`}
    >
      <span className={danger ? 'text-[#fca5a5]' : 'text-white/70'}>{icon}</span>
      {label}
    </button>
  );
}

function MenuDivider() {
  return <div className="h-px bg-white/10" />;
}
