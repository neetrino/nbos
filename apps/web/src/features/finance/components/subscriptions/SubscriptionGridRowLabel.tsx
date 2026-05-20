'use client';

import { AlertTriangle, Calendar, Clock, Handshake } from 'lucide-react';
import type { Subscription, SubscriptionGridCell } from '@/lib/api/finance';
import { getSubscriptionTypePresentation } from '@/lib/subscription-type-visual';
import { subscriptionRowAccentClassName } from '@/lib/subscription-status-visual';
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
  onOpenSubscription: (subscriptionId: string) => void;
  subscriptionId: string;
}

export function SubscriptionGridRowLabel({
  projectName,
  subscription,
  fallbackStatus,
  fallbackType,
  currentMonthCell,
  activatingId,
  cancellingId,
  holdingId,
  onActivate,
  onCancel,
  onHold,
  onOpenSubscription,
  subscriptionId,
}: SubscriptionGridRowLabelProps) {
  const typeKey = subscription?.type ?? fallbackType;
  const status = subscription?.status ?? fallbackStatus;
  const typeVisual = getSubscriptionTypePresentation(typeKey);
  const TypeIcon = typeVisual.Icon;
  const rowAccent = subscriptionRowAccentClassName(status, typeVisual);
  const monthHint = currentMonthCell ? monthCellKindLabel(currentMonthCell.kind) : null;

  const openSheet = () => onOpenSubscription(subscriptionId);

  return (
    <div className={`flex items-start gap-2 border-l-4 py-1 pl-2 ${rowAccent}`}>
      <button
        type="button"
        className="hover:bg-secondary/50 flex min-w-0 flex-1 flex-col gap-1 rounded-md px-1 py-0.5 text-left transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          openSheet();
        }}
      >
        <p
          className="text-foreground line-clamp-2 text-sm leading-snug font-semibold"
          title={projectName}
        >
          {projectName}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
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
      </button>
      {subscription ? (
        <SubscriptionGridStatusControl
          subscription={subscription}
          activatingId={activatingId}
          cancellingId={cancellingId}
          holdingId={holdingId}
          onActivate={onActivate}
          onCancel={onCancel}
          onHold={onHold}
        />
      ) : null}
    </div>
  );
}
