'use client';

import { useMemo } from 'react';
import { Puzzle } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { ExtensionEntityViews } from '@/features/projects/components/extension-entity-views';
import { ProductTabViewHero } from '@/features/projects/components/product-tabs/ProductTabViewHero';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import { useProjectDetailViewMode } from '@/features/projects/constants/projects-page-preferences-storage';
import { productExtensionToViewModel } from '@/features/projects/utils/extension-entity-view-mappers';
import type { ProductExtensionRef } from '@/lib/api/products';

interface ProductExtensionsTabProps {
  productId: string;
  extensions: ProductExtensionRef[];
}

export function ProductExtensionsTab({ productId, extensions }: ProductExtensionsTabProps) {
  const [viewMode, setViewMode] = useProjectDetailViewMode();
  const { openDeliveryItem, openDeal } = useEntityDetailSheetUrl();
  const items = useMemo(
    () => extensions.map((extension) => productExtensionToViewModel(extension, productId)),
    [extensions, productId],
  );

  if (extensions.length === 0) {
    return (
      <EmptyState
        icon={Puzzle}
        title="No extensions linked"
        description="No extensions linked to this product."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <ProductTabViewHero viewMode={viewMode} onViewModeChange={setViewMode} />
      <ExtensionEntityViews
        extensions={items}
        viewMode={viewMode}
        onOpenDeliveryCard={(id) => openDeliveryItem(`extension-${id}`)}
        onOpenDeal={(dealId) => openDeal(dealId)}
      />
    </div>
  );
}
