'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Plus } from 'lucide-react';
import {
  EntityItemList,
  useOpenEntityItemFromSummary,
  useEntityItemMobileView,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { dealInvoiceToItemSummary } from '@/features/finance/entity-item/invoice-item-summary';
import {
  DEAL_INVOICE_FIELDS_REQUIRED_MESSAGE,
  dealInvoiceCreateDeniedMessage,
} from '@/features/crm/utils/deal-invoice-create-guard';
import {
  canOpenDealCreateInvoiceDialog,
  canCreateDepositInvoice,
} from '@/features/crm/utils/deal-invoice-eligibility';
import type { Deal } from '@/lib/api/deals';
import { usePermission } from '@/lib/permissions';
import { toast } from 'sonner';

interface DealInvoiceTabProps {
  deal: Deal;
  onCreateOpenChange: (open: boolean) => void;
}

export function DealInvoiceTab({ deal, onCreateOpenChange }: DealInvoiceTabProps) {
  const t = useTranslations('crm');
  const { can } = usePermission();
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const displayVariant = useEntityItemMobileView(viewVariant);

  const taxStatus = deal.taxStatus ?? 'TAX';
  const canCreate = canOpenDealCreateInvoiceDialog(deal, taxStatus);
  const isDepositBootstrap = canCreateDepositInvoice(deal, taxStatus);
  const requestCreate = () => {
    const denied = dealInvoiceCreateDeniedMessage(can('ADD', 'FINANCE_INVOICES'), canCreate);
    if (denied) {
      toast.error(
        denied === DEAL_INVOICE_FIELDS_REQUIRED_MESSAGE
          ? t('dealSheet.invoiceFieldsRequired')
          : denied,
      );
      return;
    }
    onCreateOpenChange(true);
  };

  const allInvoices = (deal.orders ?? []).flatMap((order) =>
    (order.invoices ?? []).map((inv) => ({ ...inv, order })),
  );

  const itemSummaries = useMemo(
    () =>
      allInvoices.map((inv) =>
        dealInvoiceToItemSummary(inv, {
          code: inv.order.code,
          deal: { name: deal.name, code: deal.code },
        }),
      ),
    [allInvoices, deal.code, deal.name],
  );

  const emptyDescription = canCreate
    ? isDepositBootstrap
      ? t('dealSheet.invoicesEmptyDeposit')
      : t('dealSheet.invoicesEmptyAdd')
    : t('dealSheet.invoicesEmptyFillFields');

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
        onClick={requestCreate}
      >
        <Plus size={14} />
        {t('dealSheet.createInvoice')}
      </Button>

      {allInvoices.length > 0 ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ViewModeSwitch
            value={viewVariant}
            onChange={setViewVariant}
            options={ENTITY_ITEM_VIEW_OPTIONS}
            ariaLabel={t('dealSheet.invoiceListAria')}
          />
        </div>
      ) : null}

      <EntityItemList
        items={itemSummaries}
        variant={displayVariant}
        onOpen={onOpenItem}
        emptyIcon={FileText}
        emptyTitle={t('dealSheet.invoicesEmptyTitle')}
        emptyDescription={emptyDescription}
      />
    </div>
  );
}
