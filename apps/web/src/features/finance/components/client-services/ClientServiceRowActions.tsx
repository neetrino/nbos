'use client';

import { CheckSquare, FileText, ListChecks, MoreHorizontal, Receipt, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ClientServiceRecord } from '@/lib/api/client-services';

export type ClientServiceActionKind = 'invoice' | 'plan' | 'expense' | 'task';

interface ClientServiceRowActionsProps {
  service: ClientServiceRecord;
  actionId: string | null;
  canCreateTask: boolean;
  onAction: (service: ClientServiceRecord, kind: ClientServiceActionKind) => void;
  onRequestDelete: (target: { id: string; name: string }) => void;
}

export function ClientServiceRowActions({
  service,
  actionId,
  canCreateTask,
  onAction,
  onRequestDelete,
}: ClientServiceRowActionsProps) {
  const busy = actionId?.endsWith(`:${service.id}`) ?? false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
            aria-label={`Actions for ${service.name}`}
            disabled={busy}
            onClick={(event) => {
              event.stopPropagation();
              props.onClick?.(event);
            }}
          >
            <MoreHorizontal size={14} />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        {service.billingModel === 'CLIENT_PAID' ? (
          <DropdownMenuItem
            disabled={actionId === `invoice:${service.id}`}
            onClick={() => onAction(service, 'invoice')}
          >
            <FileText size={14} className="mr-2 opacity-70" aria-hidden />
            Create invoice
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          disabled={actionId === `plan:${service.id}`}
          onClick={() => onAction(service, 'plan')}
        >
          <ListChecks size={14} className="mr-2 opacity-70" aria-hidden />
          Create expense plan
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={actionId === `expense:${service.id}`}
          onClick={() => onAction(service, 'expense')}
        >
          <Receipt size={14} className="mr-2 opacity-70" aria-hidden />
          Create expense
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={actionId === `task:${service.id}` || !canCreateTask}
          onClick={() => onAction(service, 'task')}
        >
          <CheckSquare size={14} className="mr-2 opacity-70" aria-hidden />
          Create task
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRequestDelete({ id: service.id, name: service.name })}
        >
          <Trash2 size={14} className="mr-2 opacity-70" aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
