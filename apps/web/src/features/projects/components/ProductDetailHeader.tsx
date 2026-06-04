'use client';

import { useState } from 'react';
import { ChevronsUpDown, Package } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { getProductDeliveryStageBadgeDisplay } from '@/features/projects/constants/delivery-stage-display';
import type { FullProduct, Product } from '@/lib/api/products';
import { cn } from '@/lib/utils';

export interface ProductDetailHeaderProps {
  product: FullProduct;
  siblingProducts: Product[];
  onSelectProduct: (productId: string) => void;
}

const PRODUCT_TITLE_CLASS =
  'text-foreground truncate text-base font-semibold tracking-tight xl:text-lg';

type StageBadge = ReturnType<typeof getProductDeliveryStageBadgeDisplay>;

export function ProductDetailHeader({
  product,
  siblingProducts,
  onSelectProduct,
}: ProductDetailHeaderProps) {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const stageStatus = getProductDeliveryStageBadgeDisplay(product);
  const hasProductSwitcher = siblingProducts.length > 1;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
      <div className="shrink-0 rounded-lg bg-purple-500/10 p-2 text-purple-500" aria-hidden>
        <Package className="size-4" />
      </div>
      {hasProductSwitcher ? (
        <ProductNameSwitcher
          productName={product.name}
          stageStatus={stageStatus}
          open={showSwitcher}
          onOpenChange={setShowSwitcher}
          siblingProducts={siblingProducts}
          currentProductId={product.id}
          onSelectProduct={onSelectProduct}
        />
      ) : (
        <ProductTitleRow productName={product.name} stageStatus={stageStatus} />
      )}
    </div>
  );
}

function ProductTitleRow({
  productName,
  stageStatus,
}: {
  productName: string;
  stageStatus: StageBadge;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
      <span className={PRODUCT_TITLE_CLASS}>{productName}</span>
      {stageStatus ? <StatusBadge label={stageStatus.label} variant={stageStatus.variant} /> : null}
    </div>
  );
}

function ProductNameSwitcher({
  productName,
  stageStatus,
  open,
  onOpenChange,
  siblingProducts,
  currentProductId,
  onSelectProduct,
}: {
  productName: string;
  stageStatus: StageBadge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siblingProducts: Product[];
  currentProductId: string;
  onSelectProduct: (productId: string) => void;
}) {
  return (
    <div className="relative max-w-full min-w-0 shrink">
      <button
        type="button"
        className={cn(
          'hover:text-foreground/80 inline-flex max-w-full min-w-0 flex-wrap items-center gap-1.5 rounded-md transition-colors sm:gap-2',
          open && 'text-foreground/80',
        )}
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Switch product, current: ${productName}`}
      >
        <span className={cn(PRODUCT_TITLE_CLASS, 'min-w-0')}>{productName}</span>
        {stageStatus ? (
          <StatusBadge label={stageStatus.label} variant={stageStatus.variant} />
        ) : null}
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} aria-hidden />
          <ul
            className="bg-popover border-border absolute top-full left-0 z-50 mt-1 min-w-[220px] rounded-lg border p-1 shadow-lg"
            role="listbox"
          >
            {siblingProducts.map((item) => {
              const itemStageStatus = getProductDeliveryStageBadgeDisplay(item);
              const isCurrent = item.id === currentProductId;
              return (
                <li key={item.id} role="option" aria-selected={isCurrent}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      if (!isCurrent) onSelectProduct(item.id);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      isCurrent ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-secondary',
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                    {itemStageStatus ? (
                      <StatusBadge
                        label={itemStageStatus.label}
                        variant={itemStageStatus.variant}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
