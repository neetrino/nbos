'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckSquare, ExternalLink, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { DetailSheetSection } from '@/components/shared';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { TASK_OPEN_QUERY } from '@/features/tasks/constants/task-open-query';
import { TICKET_WAITING_OVERLAY_OPTIONS } from '@/features/support/constants/support';
import {
  translateSupportWaiting,
  type SupportTranslator,
} from '@/features/support/support-message-keys';
import { supportApi } from '@/lib/api/support';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { SupportTicket } from '@/lib/api/support';
import type { Task } from '@/lib/api/tasks';

interface SidePanelBaseProps {
  ticket: SupportTicket;
  terminal: boolean;
  onListInvalidate: () => void;
  onReloadTicket: () => Promise<void>;
}

export function SupportTicketWaitingOverlaySection({
  ticket,
  terminal,
  onListInvalidate,
  onReloadTicket,
}: SidePanelBaseProps) {
  const t = useTranslations('support') as SupportTranslator;
  const [waitingBusy, setWaitingBusy] = useState(false);

  const updateWaitingState = useCallback(
    async (value: string) => {
      if (value === (ticket.waitingState ?? 'NONE')) return;
      setWaitingBusy(true);
      try {
        await supportApi.updateWaiting(ticket.id, { waitingState: value });
        await onReloadTicket();
        onListInvalidate();
      } catch (err) {
        toast.error(getApiErrorMessage(err, t('errors.waitingUpdateFailed')));
      } finally {
        setWaitingBusy(false);
      }
    },
    [onListInvalidate, onReloadTicket, t, ticket.id, ticket.waitingState],
  );

  return (
    <DetailSheetSection title={t('sheet.waitingOverlay')}>
      <SupportTicketWaitingOverlaySelect
        ticketId={ticket.id}
        waitingState={ticket.waitingState}
        waitingReason={ticket.waitingReason}
        disabled={terminal || waitingBusy}
        onChange={updateWaitingState}
      />
    </DetailSheetSection>
  );
}

function SupportTicketWaitingOverlaySelect({
  ticketId,
  waitingState,
  waitingReason,
  disabled,
  onChange,
}: {
  ticketId: string;
  waitingState: string | null | undefined;
  waitingReason: string | null | undefined;
  disabled: boolean;
  onChange: (value: string) => Promise<void>;
}) {
  const t = useTranslations('support') as SupportTranslator;
  return (
    <div className="space-y-2">
      <Label htmlFor={`st-wait-${ticketId}`} className="sr-only">
        {t('sheet.waitingOverlay')}
      </Label>
      <Select
        value={waitingState ?? 'NONE'}
        onValueChange={(v) => {
          if (v) void onChange(v);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={`st-wait-${ticketId}`}
          className="w-full"
          aria-label={t('sheet.waitingOverlay')}
        >
          <SelectValue placeholder={t('sheet.waitingOverlay')} />
        </SelectTrigger>
        <SelectContent align="start" className="w-auto min-w-[min(100vw-2rem,12rem)] p-1.5">
          {TICKET_WAITING_OVERLAY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {translateSupportWaiting(t, opt.value, opt.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {waitingReason ? (
        <p className="text-muted-foreground line-clamp-3 text-xs">{waitingReason}</p>
      ) : null}
    </div>
  );
}

export function SupportTicketChangeControlSection({
  ticket,
  terminal,
  meId,
  onListInvalidate,
  onReloadTicket,
}: SidePanelBaseProps & { meId: string | null }) {
  const t = useTranslations('support') as SupportTranslator;
  const [extensionDealBusy, setExtensionDealBusy] = useState(false);

  const createExtensionDeal = useCallback(async () => {
    if (!meId) return;
    setExtensionDealBusy(true);
    try {
      await supportApi.createExtensionDeal(ticket.id, { sellerId: meId });
      await onReloadTicket();
      onListInvalidate();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.extensionDealFailed')));
    } finally {
      setExtensionDealBusy(false);
    }
  }, [meId, onListInvalidate, onReloadTicket, t, ticket.id]);

  return (
    <DetailSheetSection title={t('sheet.changeControl')} icon={<FilePlus2 size={12} />}>
      <SupportTicketChangeControlBody
        ticket={ticket}
        terminal={terminal}
        meId={meId}
        busy={extensionDealBusy}
        onCreate={() => void createExtensionDeal()}
      />
    </DetailSheetSection>
  );
}

function SupportTicketChangeControlBody({
  ticket,
  terminal,
  meId,
  busy,
  onCreate,
}: {
  ticket: SupportTicket;
  terminal: boolean;
  meId: string | null;
  busy: boolean;
  onCreate: () => void;
}) {
  const t = useTranslations('support');
  if (ticket.extensionDeal) {
    return (
      <Link
        href={`/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(ticket.extensionDeal.id)}`}
        className="text-primary inline-flex items-center gap-1 text-sm font-medium"
      >
        {t('sheet.extensionDeal', { code: ticket.extensionDeal.code })}
        <ExternalLink size={12} />
      </Link>
    );
  }
  if (ticket.category !== 'CHANGE_REQUEST') {
    return <p className="text-muted-foreground text-sm">{t('sheet.notChangeRequest')}</p>;
  }
  if (!ticket.productId) {
    return <p className="text-muted-foreground text-sm">{t('sheet.extensionDealNeedProduct')}</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">{t('sheet.extensionDealHint')}</p>
      <Button
        type="button"
        size="sm"
        disabled={terminal || busy || !meId || !ticket.productId}
        onClick={onCreate}
      >
        <FilePlus2 size={14} aria-hidden />
        {t('sheet.extensionDealButton')}
      </Button>
    </div>
  );
}

export function SupportTicketExecutionTasksSection({
  ticket,
  terminal,
  meId,
  taskBusy,
  onOpenCreateTask,
}: {
  ticket: SupportTicket;
  terminal: boolean;
  meId: string | null;
  taskBusy: boolean;
  onOpenCreateTask: () => void;
}) {
  const t = useTranslations('support');
  const tCommon = useTranslations('common');
  const executionTasks = ticket.executionTasks ?? [];

  return (
    <DetailSheetSection title={t('sheet.executionTasks')} icon={<CheckSquare size={12} />}>
      <div className="mb-3 flex justify-end">
        <Button type="button" size="sm" disabled={!meId || terminal || taskBusy} onClick={onOpenCreateTask}>
          <CheckSquare size={14} />
          {t('sheet.newTask')}
        </Button>
      </div>
      {executionTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('sheet.noLinkedTasks')}</p>
      ) : (
        <ul className="space-y-2">
          {executionTasks.map((task: Task) => (
            <li
              key={task.id}
              className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="text-muted-foreground text-xs">{task.code}</p>
              </div>
              <Link
                href={`/tasks?${TASK_OPEN_QUERY}=${encodeURIComponent(task.id)}`}
                className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium"
              >
                {tCommon('sheet.open')}
                <ExternalLink size={12} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DetailSheetSection>
  );
}
