'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Clock3, Copy, Hash, Mail, Settings, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WHATSAPP_GATEWAY_NOT_CONFIGURED_MESSAGE } from '../product-whatsapp-settings';
import {
  formatProductWhatsAppTimestamp,
  productWhatsAppStatusLabel,
  WA_SECTION_CARD,
  WHATSAPP_GATEWAY_SETTINGS_HREF,
} from './product-whatsapp-settings-ui';

interface ProductWhatsAppStatusCardProps {
  loading: boolean;
  gatewayNotice: string | null;
  status: string;
  groupName: string | null | undefined;
  groupChatId: string | null | undefined;
  lastSuccessfulSyncAt: string | null | undefined;
  invitationStatus: string | null | undefined;
  lastErrorMessage: string | null | undefined;
}

export function ProductWhatsAppStatusCard({
  loading,
  gatewayNotice,
  status,
  groupName,
  groupChatId,
  lastSuccessfulSyncAt,
  invitationStatus,
  lastErrorMessage,
}: ProductWhatsAppStatusCardProps) {
  const showConfigureGateway = gatewayNotice === WHATSAPP_GATEWAY_NOT_CONFIGURED_MESSAGE;
  return (
    <section className={WA_SECTION_CARD}>
      <div className="mb-3 flex items-center gap-2">
        <Users className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <h3 className="text-foreground text-sm font-semibold tracking-tight">WhatsApp group</h3>
      </div>

      {gatewayNotice ? (
        <div
          role="status"
          className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <AlertTriangle
            className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <p className="min-w-0 flex-1 font-medium">{gatewayNotice}</p>
          {showConfigureGateway ? (
            <Link
              href={WHATSAPP_GATEWAY_SETTINGS_HREF}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50 dark:hover:bg-amber-900',
              )}
            >
              <Settings className="size-3.5" aria-hidden />
              Configure gateway
            </Link>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <dl className="divide-border divide-y">
          <StatusRow icon={Activity} label="Status">
            <StatusValueBadge status={status} />
          </StatusRow>
          <StatusRow icon={Users} label="Group name">
            <span className="text-foreground min-w-0 truncate font-medium">{groupName || '—'}</span>
          </StatusRow>
          <StatusRow icon={Hash} label="Group ID">
            <div className="flex min-w-0 items-center justify-end gap-1.5">
              <span className="text-foreground min-w-0 truncate font-medium">
                {groupChatId || '—'}
              </span>
              {groupChatId ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Copy group ID"
                  className="text-muted-foreground shrink-0"
                  onClick={() => {
                    void navigator.clipboard.writeText(groupChatId).then(
                      () => toast.success('Group ID copied'),
                      () => toast.error('Could not copy group ID'),
                    );
                  }}
                >
                  <Copy className="size-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          </StatusRow>
          <StatusRow icon={Clock3} label="Last sync">
            <span className="text-foreground font-medium">
              {formatProductWhatsAppTimestamp(lastSuccessfulSyncAt)}
            </span>
          </StatusRow>
          <StatusRow icon={Mail} label="Invitation">
            <span className="text-foreground font-medium">{invitationStatus || '—'}</span>
          </StatusRow>
        </dl>
      )}

      {lastErrorMessage ? (
        <p className="text-destructive mt-3 text-sm">{lastErrorMessage}</p>
      ) : null}
    </section>
  );
}

function StatusRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Activity;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}

function StatusValueBadge({ status }: { status: string }) {
  const label = productWhatsAppStatusLabel(status);
  const missing = status !== 'ACTIVE';
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        missing
          ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
          : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
      )}
    >
      {label}
    </Badge>
  );
}
