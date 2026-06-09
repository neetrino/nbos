'use client';

import { useCallback, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { mailApi, type MailDeliveryLogRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { formatMailDeliveryLogKind } from './mail-delivery-log-labels';

export interface MailOutboundDeliveryLogSectionProps {
  threadId: string;
  messageId: string;
}

export function MailOutboundDeliveryLogSection({
  threadId,
  messageId,
}: MailOutboundDeliveryLogSectionProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MailDeliveryLogRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await mailApi.listMessageDeliveryLogs(threadId, messageId);
      setItems(rows);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load delivery log.'));
    } finally {
      setLoading(false);
    }
  }, [threadId, messageId]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && items === null && !loading) {
      void load();
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className="border-muted mt-2 rounded-md border"
    >
      <CollapsibleTrigger className="text-muted-foreground hover:bg-muted/40 flex w-full items-center justify-between gap-2 px-2 py-1.5 text-xs select-none">
        <span>Delivery pipeline log</span>
        <ChevronDown
          className={cn('size-3 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-muted border-t px-2 py-2">
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        {loading ? <p className="text-muted-foreground text-xs">Loading…</p> : null}
        {!loading && items?.length === 0 ? (
          <p className="text-muted-foreground text-xs">No log entries yet.</p>
        ) : null}
        {!loading && items && items.length > 0 ? (
          <ul className="space-y-1.5 text-xs">
            {items.map((row) => (
              <li key={row.id} className="text-muted-foreground">
                <span className="text-foreground font-medium">
                  {formatMailDeliveryLogKind(row.kind)}
                </span>
                {' · '}
                {new Date(row.createdAt).toLocaleString()}
                {row.detail ? (
                  <>
                    <br />
                    <span className="break-words">{row.detail}</span>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
