'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  Server,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DROPDOWN_TRIGGER_CHEVRON_ROTATE_CLASS } from '@/components/ui/dropdown-chevron';
import { cn } from '@/lib/utils';
import { supportApi, type SupportTicket } from '@/lib/api/support';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  onClick: () => void;
}

interface SupportTicketSheetQuickActionsProps {
  ticket: SupportTicket;
  onRequestEscalate: (ticket: SupportTicket) => void;
  onRequestTechnical: (ticket: SupportTicket) => void;
  onRequestResolve: (ticket: SupportTicket) => void;
  onRequestClose: (ticket: SupportTicket) => void;
  onReloadTicket: () => Promise<void>;
  onListInvalidate: () => void;
}

export function SupportTicketSheetQuickActions({
  ticket,
  onRequestEscalate,
  onRequestTechnical,
  onRequestResolve,
  onRequestClose,
  onReloadTicket,
  onListInvalidate,
}: SupportTicketSheetQuickActionsProps) {
  const terminal = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  const actions = useMemo((): QuickActionItem[] => {
    const items: QuickActionItem[] = [
      {
        id: 'escalate',
        label: 'Escalate',
        icon: AlertTriangle,
        enabled: !terminal,
        onClick: () => onRequestEscalate(ticket),
      },
      {
        id: 'technical',
        label: 'Technical',
        icon: Server,
        enabled: !terminal,
        onClick: () => onRequestTechnical(ticket),
      },
    ];

    if (terminal) {
      items.push({
        id: 'reopen',
        label: 'Reopen',
        icon: RotateCcw,
        enabled: true,
        onClick: () => {
          void (async () => {
            try {
              await supportApi.reopen(ticket.id);
              await onReloadTicket();
              onListInvalidate();
            } catch (caught) {
              toast.error(getApiErrorMessage(caught, 'Ticket could not be reopened.'));
            }
          })();
        },
      });
    } else {
      items.push({
        id: 'resolve',
        label: 'Mark resolved',
        icon: CheckCircle2,
        enabled: true,
        onClick: () => onRequestResolve(ticket),
      });
    }

    if (ticket.status === 'RESOLVED') {
      items.push({
        id: 'close',
        label: 'Close',
        icon: XCircle,
        enabled: true,
        onClick: () => onRequestClose(ticket),
      });
    }

    return items;
  }, [
    onListInvalidate,
    onReloadTicket,
    onRequestClose,
    onRequestEscalate,
    onRequestResolve,
    onRequestTechnical,
    terminal,
    ticket,
  ]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="sm"
            className={cn(DROPDOWN_TRIGGER_CHEVRON_ROTATE_CLASS, 'gap-1.5', props.className)}
          >
            <Zap size={14} aria-hidden />
            Quick actions
            <ChevronDown size={14} className="opacity-60" aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="w-(--anchor-width) min-w-(--anchor-width)">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              disabled={!action.enabled}
              onClick={() => action.onClick()}
            >
              <Icon />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
