'use client';

import { useTranslations } from 'next-intl';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { ProductCompositionPanel } from './product-composition-panel';
import type { ComponentProps } from 'react';

export function ProductCompositionSheet({
  open,
  onOpenChange,
  ...panel
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & ComponentProps<typeof ProductCompositionPanel>) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="full" width="wide" forceNestedBackdrop>
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-6">
          <h2 className="text-foreground text-lg font-semibold">{t('compositionSheet')}</h2>
          <ProductCompositionPanel {...panel} />
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
