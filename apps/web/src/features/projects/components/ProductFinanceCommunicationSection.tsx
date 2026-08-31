'use client';

import { Check, Plus } from 'lucide-react';
import { productWhatsAppApi } from '@/lib/api/whatsapp';
import { cn } from '@/lib/utils';
import {
  WA_ACTION_CARD,
  WA_ACCENT_ICON_WRAP,
  WA_SECTION_CARD,
} from './product-whatsapp-settings-ui';

export function ProductFinanceCommunicationSection(props: {
  productId: string;
  financeUsesWork: boolean;
  financeGroupChatId: string | null;
  busy: boolean;
  gatewayConfigured: boolean;
  onCreateFinance: () => void;
  run: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
}) {
  const usingWork = props.financeUsesWork || !props.financeGroupChatId;
  return (
    <section className={WA_SECTION_CARD}>
      <h3 className="text-foreground mb-1 text-sm font-semibold">FINANCE</h3>
      <p className="text-muted-foreground mb-3 text-xs">
        {usingWork
          ? 'Using the WORK destination (default).'
          : `Explicit destination: ${props.financeGroupChatId}`}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          className={cn(WA_ACTION_CARD, usingWork && 'border-emerald-200 dark:border-emerald-900')}
          disabled={props.busy || usingWork}
          onClick={() =>
            void props.run(
              () => productWhatsAppApi.useWorkForFinance(props.productId),
              'FINANCE will use WORK',
            )
          }
        >
          <span className={WA_ACCENT_ICON_WRAP} aria-hidden>
            <Check className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="text-foreground block text-sm font-semibold">
              Use WORK destination
            </span>
            <span className="text-muted-foreground block text-xs">Default for reminders</span>
          </span>
        </button>
        <button
          type="button"
          className={WA_ACTION_CARD}
          disabled={props.busy || !props.gatewayConfigured}
          onClick={props.onCreateFinance}
        >
          <span className={WA_ACCENT_ICON_WRAP} aria-hidden>
            <Plus className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="text-foreground block text-sm font-semibold">Create new group</span>
            <span className="text-muted-foreground block text-xs">
              Separate FINANCE WhatsApp group
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
