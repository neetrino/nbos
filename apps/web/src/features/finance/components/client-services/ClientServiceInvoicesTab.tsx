'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DetailSheetSection,
  EntityItemList,
  useOpenEntityItemFromSummary,
  useEntityItemMobileView,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { clientServiceInvoiceLinkToItemSummary } from '@/features/finance/entity-item/client-service-finance-item-summary';
import type { ClientServiceFinanceLinks } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';
import { useClientServicesT } from './client-service-message-keys';

interface ClientServiceInvoicesTabProps {
  links: ClientServiceFinanceLinks | undefined;
  canCreateInvoice: boolean;
  onCreate: () => void;
}

export function ClientServiceInvoicesTab({
  links,
  canCreateInvoice,
  onCreate,
}: ClientServiceInvoicesTabProps) {
  const t = useClientServicesT();
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const displayVariant = useEntityItemMobileView(viewVariant);
  const invoices = useMemo(() => links?.invoices ?? [], [links?.invoices]);
  const firstInvoice = invoices[0];

  const itemSummaries = useMemo(
    () => invoices.map((row) => clientServiceInvoiceLinkToItemSummary(row)),
    [invoices],
  );

  return (
    <DetailSheetSection title={t('invoicesTab.title')} icon={<FileText size={12} />}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {canCreateInvoice ? (
          <Button type="button" size="sm" disabled={!canCreateInvoice} onClick={onCreate}>
            <Plus size={14} aria-hidden />
            {t('invoicesTab.create')}
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">{t('invoicesTab.wePayOnly')}</p>
        )}
        <ViewModeSwitch
          value={viewVariant}
          onChange={setViewVariant}
          options={ENTITY_ITEM_VIEW_OPTIONS}
          ariaLabel={t('invoicesTab.viewAria')}
        />
      </div>

      <EntityItemList
        items={itemSummaries}
        variant={displayVariant}
        onOpen={onOpenItem}
        emptyIcon={FileText}
        emptyTitle={t('invoicesTab.emptyTitle')}
        emptyDescription={t('invoicesTab.emptyDescription')}
      />

      {firstInvoice ? (
        <Link
          href={`/finance/invoices?${OPEN_INVOICE_QUERY}=${encodeURIComponent(firstInvoice.id)}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 gap-1.5')}
        >
          <FileText size={14} aria-hidden />
          {t('invoicesTab.openFinance')}
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      ) : null}
    </DetailSheetSection>
  );
}
