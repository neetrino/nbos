'use client';

import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { resolveBlockerDirectActions } from '@/features/shared/blocker-actions';
import type { DeliveryBoardStageGateBlocker } from './project-delivery-board-stage-gate';
import {
  resolveExtensionStageGateActionHref,
  resolveProductStageGateActionHref,
} from '@/features/projects/utils/projects-hub-stage-gate-blocker-hrefs';

interface DeliveryBoardStageGateBannerProps {
  blocker: DeliveryBoardStageGateBlocker;
  onDismiss: () => void;
}

export function DeliveryBoardStageGateBanner({
  blocker,
  onDismiss,
}: DeliveryBoardStageGateBannerProps) {
  const context = blocker.variant === 'product' ? 'product' : 'extension';
  const directActions = resolveBlockerDirectActions({
    context,
    errors: blocker.errors,
  });

  const fallbackAction =
    blocker.variant === 'product'
      ? { key: 'pm-intake', label: 'Open product overview' }
      : { key: 'extension-intake', label: 'Open extension on product' };

  const visibleActions = directActions.length > 0 ? directActions : [fallbackAction];

  return (
    <div className="relative rounded-xl border border-amber-200 bg-amber-50 p-4 pr-12 dark:border-amber-900/60 dark:bg-amber-950/20">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground absolute top-2 right-2 size-8"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X size={16} />
      </Button>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {blocker.itemLabel}
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{blocker.message}</p>
          {blocker.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-300">
              {blocker.errors.map((error) => (
                <li key={`${error.field}-${error.message}`}>- {error.message}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleActions.map((action) => (
              <Link
                key={action.key}
                href={
                  blocker.variant === 'product'
                    ? resolveProductStageGateActionHref({
                        projectId: blocker.projectId,
                        productId: blocker.productId,
                        action,
                      })
                    : resolveExtensionStageGateActionHref({
                        projectId: blocker.projectId,
                        productId: blocker.productId,
                        action,
                      })
                }
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
