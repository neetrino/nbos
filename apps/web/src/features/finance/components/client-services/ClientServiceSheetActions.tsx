'use client';

import { CheckSquare, FileText, ListChecks, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientServiceRecord } from '@/lib/api/client-services';

export type ClientServiceActionKind = 'invoice' | 'plan' | 'expense';

interface ClientServiceSheetActionsProps {
  service: ClientServiceRecord;
  actionId: string | null;
  canCreateTask: boolean;
  disabled?: boolean;
  onAction: (kind: ClientServiceActionKind) => void;
  onCreateTask: () => void;
}

export function ClientServiceSheetActions({
  service,
  actionId,
  canCreateTask,
  disabled = false,
  onAction,
  onCreateTask,
}: ClientServiceSheetActionsProps) {
  const busy = disabled || (actionId?.endsWith(`:${service.id}`) ?? false);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {service.billingModel === 'CLIENT_PAID' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || actionId === `invoice:${service.id}`}
          onClick={() => onAction('invoice')}
        >
          <FileText size={14} aria-hidden />
          Create invoice
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || actionId === `plan:${service.id}`}
        onClick={() => onAction('plan')}
      >
        <ListChecks size={14} aria-hidden />
        Create expense plan
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || actionId === `expense:${service.id}`}
        onClick={() => onAction('expense')}
      >
        <Receipt size={14} aria-hidden />
        Create expense
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || !canCreateTask}
        onClick={onCreateTask}
      >
        <CheckSquare size={14} aria-hidden />
        Create task
      </Button>
    </div>
  );
}
