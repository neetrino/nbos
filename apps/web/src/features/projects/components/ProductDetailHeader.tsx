'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ChevronsUpDown, Package } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/shared';
import { getProductDeliveryStageBadgeDisplay } from '@/features/projects/constants/delivery-stage-display';
import { InlineEditableEntityTitle } from '@/features/projects/components/InlineEditableEntityTitle';
import { DetailPageMobileBackLink, DETAIL_PAGE_MOBILE_BACK_ROW_CLASS } from '@/features/projects/components/DetailPageMobileBackLink';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { getApiErrorMessage } from '@/lib/api-errors';
import { productsApi, type FullProduct, type Product } from '@/lib/api/products';
import { cn } from '@/lib/utils';

export interface ProductDetailHeaderProps {
  product: FullProduct;
  siblingProducts: Product[];
  projectHref: string;
  onSelectProduct: (productId: string) => void;
  onProductUpdated: (product: FullProduct) => void;
}

const PRODUCT_TITLE_CLASS =
  'text-foreground truncate text-base font-semibold tracking-tight xl:text-lg';

const PRODUCT_TITLE_MOBILE_CLASS =
  'text-foreground min-w-0 max-w-none flex-1 truncate text-base font-semibold tracking-tight';

export function ProductDetailHeader({
  product,
  siblingProducts,
  projectHref,
  onSelectProduct,
  onProductUpdated,
}: ProductDetailHeaderProps) {
  const isMobileViewport = useIsMobileViewport();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const stageStatus = getProductDeliveryStageBadgeDisplay(product);
  const hasProductSwitcher = siblingProducts.length > 1;

  const handleCommitName = useCallback(
    async (trimmed: string) => {
      try {
        const updated = await productsApi.update(product.id, { name: trimmed });
        onProductUpdated({ ...product, name: updated.name, updatedAt: updated.updatedAt });
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Product name could not be updated.'));
        throw caught;
      }
    },
    [onProductUpdated, product],
  );

  const stageBadge = stageStatus ? (
    <StatusBadge
      label={stageStatus.label}
      variant={stageStatus.variant}
      className="shrink-0 self-center"
    />
  ) : null;

  const switcher = hasProductSwitcher ? (
    <ProductSwitcherTrigger
      open={showSwitcher}
      onOpenChange={setShowSwitcher}
      productName={product.name}
      siblingProducts={siblingProducts}
      currentProductId={product.id}
      onSelectProduct={onSelectProduct}
    />
  ) : null;

  if (isMobileViewport) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-2.5">
        <div className={DETAIL_PAGE_MOBILE_BACK_ROW_CLASS}>
          <DetailPageMobileBackLink href={projectHref} ariaLabel="Back to project" />
        </div>
        <div className="flex w-full min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            <InlineEditableEntityTitle
              value={product.name}
              onCommit={handleCommitName}
              editHint="Click to edit product name"
              className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
              titleClassName={PRODUCT_TITLE_MOBILE_CLASS}
            />
            {switcher}
          </div>
          {stageBadge}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
      <div className="shrink-0 rounded-lg bg-purple-500/10 p-2 text-purple-500" aria-hidden>
        <Package className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
          <InlineEditableEntityTitle
            value={product.name}
            onCommit={handleCommitName}
            editHint="Click to edit product name"
            titleClassName={PRODUCT_TITLE_CLASS}
          />
          {stageBadge}
          {switcher}
        </div>
        <Link
          href={projectHref}
          className="text-muted-foreground hover:text-foreground mt-0.5 block truncate text-xs transition-colors"
        >
          {product.project.name}
        </Link>
      </div>
    </div>
  );
}

function ProductSwitcherTrigger({
  open,
  onOpenChange,
  productName,
  siblingProducts,
  currentProductId,
  onSelectProduct,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  siblingProducts: Product[];
  currentProductId: string;
  onSelectProduct: (productId: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className={cn(
          'text-muted-foreground hover:text-foreground inline-flex items-center rounded-md p-1 transition-colors',
          open && 'text-foreground',
        )}
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Switch product, current: ${productName}`}
      >
        <ChevronsUpDown className="size-3.5 opacity-60" aria-hidden />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} aria-hidden />
          <ul
            className="bg-popover border-border absolute top-full right-0 z-50 mt-1 min-w-[220px] rounded-lg border p-1 shadow-lg"
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
