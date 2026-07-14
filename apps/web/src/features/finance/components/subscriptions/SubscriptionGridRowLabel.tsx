'use client';

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AlertTriangle, Calendar, Clock, Handshake } from 'lucide-react';
import type { Subscription, SubscriptionGridCell } from '@/lib/api/finance';
import { getSubscriptionTypePresentation } from '@/lib/subscription-type-visual';
import { monthCellKindLabel } from './subscription-grid-utils';
import { SubscriptionGridStatusControl } from './SubscriptionGridStatusControl';

interface SubscriptionGridRowLabelProps {
  projectName: string;
  subscription: Subscription | undefined;
  fallbackStatus: string;
  fallbackType: string;
  currentMonthCell: SubscriptionGridCell | null;
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => Promise<void>;
  onHold: (subscription: Subscription) => Promise<void>;
}

const TITLE_CLASS = 'text-foreground truncate text-sm leading-snug font-semibold whitespace-nowrap';
/** Approx. status chip + gap reserved when measuring short titles. */
const STATUS_BESIDE_RESERVE_PX = 92;

function useStatusBesideTitle(projectName: string): {
  rootRef: RefObject<HTMLDivElement | null>;
  measureRef: RefObject<HTMLSpanElement | null>;
  statusBesideTitle: boolean;
} {
  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [statusBesideTitle, setStatusBesideTitle] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;

    const update = () => {
      const available = root.clientWidth - STATUS_BESIDE_RESERVE_PX;
      setStatusBesideTitle(available > 0 && measure.scrollWidth <= available);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, [projectName]);

  return { rootRef, measureRef, statusBesideTitle };
}

function StatusSlot({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex shrink-0 items-center"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function RowMetaIcons({
  subscription,
  typeVisual,
  currentMonthCell,
}: {
  subscription: Subscription | undefined;
  typeVisual: ReturnType<typeof getSubscriptionTypePresentation>;
  currentMonthCell: SubscriptionGridCell | null;
}) {
  const TypeIcon = typeVisual.Icon;
  const monthHint = currentMonthCell ? monthCellKindLabel(currentMonthCell.kind) : null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex rounded-md p-1 ${typeVisual.iconWrapClassName}`}
        title={typeVisual.label}
      >
        <TypeIcon size={12} aria-hidden />
      </span>
      {subscription ? (
        <span
          className="text-muted-foreground inline-flex items-center gap-0.5 text-[10px]"
          title={`Billing day ${subscription.billingDay}`}
        >
          <Calendar size={10} aria-hidden />
          {subscription.billingDay}
        </span>
      ) : null}
      {subscription?.partner?.name ? (
        <span
          className="text-muted-foreground inline-flex items-center gap-0.5 text-[10px]"
          title={subscription.partner.name}
        >
          <Handshake size={10} aria-hidden />
        </span>
      ) : null}
      {currentMonthCell?.kind === 'OVERDUE_INVOICE' ? (
        <span
          className="text-destructive inline-flex items-center gap-0.5 text-[10px] font-medium"
          title={monthHint ?? undefined}
        >
          <AlertTriangle size={10} aria-hidden />
        </span>
      ) : null}
      {currentMonthCell?.kind === 'PENDING_INVOICE' ? (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300"
          title={monthHint ?? undefined}
        >
          <Clock size={10} aria-hidden />
        </span>
      ) : null}
    </div>
  );
}

export function SubscriptionGridRowLabel({
  projectName,
  subscription,
  fallbackType,
  currentMonthCell,
  activatingId,
  cancellingId,
  holdingId,
  onActivate,
  onCancel,
  onHold,
}: SubscriptionGridRowLabelProps) {
  const typeVisual = getSubscriptionTypePresentation(subscription?.type ?? fallbackType);
  const { rootRef, measureRef, statusBesideTitle } = useStatusBesideTitle(projectName);

  const statusControl =
    subscription != null ? (
      <SubscriptionGridStatusControl
        subscription={subscription}
        activatingId={activatingId}
        cancellingId={cancellingId}
        holdingId={holdingId}
        onActivate={onActivate}
        onCancel={onCancel}
        onHold={onHold}
      />
    ) : null;

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-12 w-full flex-col justify-center gap-1 py-1 pr-1 pl-2"
    >
      <span
        ref={measureRef}
        className="pointer-events-none invisible absolute top-0 left-0 text-sm leading-snug font-semibold whitespace-nowrap"
        aria-hidden
      >
        {projectName}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <p className={`min-w-0 flex-1 ${TITLE_CLASS}`} title={projectName}>
          {projectName}
        </p>
        {statusBesideTitle && statusControl ? <StatusSlot>{statusControl}</StatusSlot> : null}
      </div>
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <RowMetaIcons
          subscription={subscription}
          typeVisual={typeVisual}
          currentMonthCell={currentMonthCell}
        />
        {!statusBesideTitle && statusControl ? <StatusSlot>{statusControl}</StatusSlot> : null}
      </div>
    </div>
  );
}
