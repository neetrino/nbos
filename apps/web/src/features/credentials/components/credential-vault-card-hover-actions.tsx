'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CredentialVaultCardActionButtons,
  useCredentialVaultCardActions,
  type CredentialVaultCardActionsProps,
} from '@/features/credentials/components/credential-vault-card-action-buttons';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';
import { PORTAL_DROPDOWN_Z_CLASS } from '@/lib/overlay-z-index';

/** Keeps hover while the pointer crosses the gap into the floating dock. */
const HOVER_DOCK_HIDE_DELAY_MS = 120;

const HOVER_DOCK_BRIDGE_CLASS = 'h-2 w-full shrink-0';

const FLOATING_DOCK_CLASS = cn(
  'pointer-events-auto fixed flex -translate-x-1/2 -translate-y-full flex-col items-center',
  PORTAL_DROPDOWN_Z_CLASS,
);

const MOBILE_ON_CARD_DOCK_CLASS =
  'pointer-events-auto absolute top-1/2 right-2 z-20 flex -translate-y-1/2 flex-col gap-1.5';

interface DockPosition {
  top: number;
  left: number;
}

export type CredentialVaultCardHoverActionsProps = CredentialVaultCardActionsProps;

function readDockPosition(card: HTMLElement): DockPosition {
  const rect = card.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left + rect.width / 2,
  };
}

function CredentialVaultCardMobileActions(props: CredentialVaultCardHoverActionsProps) {
  const actions = useCredentialVaultCardActions(props);

  return (
    <div
      className={MOBILE_ON_CARD_DOCK_CLASS}
      data-credential-vault-action
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <CredentialVaultCardActionButtons compact {...actions} />
    </div>
  );
}

function CredentialVaultCardDesktopHoverActions(props: CredentialVaultCardHoverActionsProps) {
  const actions = useCredentialVaultCardActions(props);
  const anchorRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DockPosition | null>(null);

  const clearHideTimer = useCallback(() => {
    if (!hideTimerRef.current) return;
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const showDock = useCallback(() => {
    const card = anchorRef.current?.parentElement;
    if (!card) return;
    clearHideTimer();
    setPosition(readDockPosition(card));
    setOpen(true);
  }, [clearHideTimer]);

  const scheduleHideDock = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setOpen(false);
      hideTimerRef.current = null;
    }, HOVER_DOCK_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  useEffect(() => {
    const card = anchorRef.current?.parentElement;
    if (!card) return;

    const onFocusOut = (event: FocusEvent) => {
      if (card.contains(event.relatedTarget as Node | null)) return;
      scheduleHideDock();
    };

    card.addEventListener('mouseenter', showDock);
    card.addEventListener('mouseleave', scheduleHideDock);
    card.addEventListener('focusin', showDock);
    card.addEventListener('focusout', onFocusOut);

    return () => {
      card.removeEventListener('mouseenter', showDock);
      card.removeEventListener('mouseleave', scheduleHideDock);
      card.removeEventListener('focusin', showDock);
      card.removeEventListener('focusout', onFocusOut);
      clearHideTimer();
    };
  }, [showDock, scheduleHideDock, clearHideTimer]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => {
      const card = anchorRef.current?.parentElement;
      if (!card) return;
      setPosition(readDockPosition(card));
    };
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open]);

  const dock =
    open && position ? (
      <div
        className={FLOATING_DOCK_CLASS}
        style={{ top: position.top, left: position.left }}
        data-credential-vault-action
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onMouseEnter={showDock}
        onMouseLeave={scheduleHideDock}
      >
        <div className="flex gap-1.5">
          <CredentialVaultCardActionButtons compact={false} {...actions} />
        </div>
        <div className={HOVER_DOCK_BRIDGE_CLASS} aria-hidden />
      </div>
    ) : null;

  return (
    <>
      <div
        ref={anchorRef}
        className="pointer-events-none absolute inset-x-0 top-0 h-0"
        aria-hidden
      />
      {dock && typeof document !== 'undefined' ? createPortal(dock, document.body) : null}
    </>
  );
}

export function CredentialVaultCardHoverActions(props: CredentialVaultCardHoverActionsProps) {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport) {
    return <CredentialVaultCardMobileActions {...props} />;
  }

  return <CredentialVaultCardDesktopHoverActions {...props} />;
}
