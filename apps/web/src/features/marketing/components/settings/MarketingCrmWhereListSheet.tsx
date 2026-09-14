'use client';

import { useTranslations } from 'next-intl';
import { EntityDetailSheetContent } from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import type { MarketingCrmWhereOption } from '@/lib/api/marketing';
import { MARKETING_CRM_WHERE_LIST_CLASS } from '@/features/marketing/constants/marketing-settings-surface';
import { MarketingCrmWhereRow } from './MarketingCrmWhereRow';

const CRM_WHERE_LIST_SHEET_KEY = 'crm-where-list';

interface MarketingCrmWhereListSheetProps {
  rows: MarketingCrmWhereOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenRow: (row: MarketingCrmWhereOption) => void;
}

export function MarketingCrmWhereListSheet({
  rows,
  open,
  onOpenChange,
  onOpenRow,
}: MarketingCrmWhereListSheetProps) {
  const t = useTranslations('marketing');
  const { persistedValue, onOpenChangeComplete } = useSheetPersistedValue(
    open ? CRM_WHERE_LIST_SHEET_KEY : null,
  );
  const hostMounted = useSheetHostMounted(open, persistedValue);

  if (!hostMounted) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent open={open} layout="auxiliary">
        <div className="bg-background shrink-0 px-7 pt-5 pb-3 max-md:px-4">
          <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
            {t('settings.crmWhere.title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('settings.crmWhere.listDescription')}
          </p>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className={cn(MARKETING_CRM_WHERE_LIST_CLASS, 'px-7 py-4 max-md:px-4')}>
            {rows.map((row) => (
              <MarketingCrmWhereRow key={row.channel} row={row} onOpen={onOpenRow} />
            ))}
          </div>
        </ScrollArea>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
