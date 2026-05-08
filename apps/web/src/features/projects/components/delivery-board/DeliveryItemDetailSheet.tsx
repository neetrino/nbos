'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared';
import { extensionsApi, type FullExtension } from '@/lib/api/extensions';
import { productsApi, type FullProduct } from '@/lib/api/products';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
} from '@/features/projects/constants/projects';
import { ProductDoneReadinessPanel } from '../product-tabs/ProductDoneReadinessPanel';
import { ProductStageGateSummary } from '../product-tabs/ProductStageGateSummary';
import { ExtensionReadiness } from '../extensions/ExtensionReadiness';
import { getItemLabel, type DeliveryBoardItem } from './project-delivery-board-model';

const PRODUCT_NEXT: Record<string, string[]> = {
  NEW: ['CREATING'],
  CREATING: ['DEVELOPMENT'],
  DEVELOPMENT: ['QA'],
  QA: ['TRANSFER', 'DEVELOPMENT'],
  TRANSFER: ['DONE', 'QA'],
  ON_HOLD: [],
  DONE: [],
  LOST: [],
};

interface DeliveryItemDetailSheetProps {
  item: DeliveryBoardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntityUpdated: () => void;
}

export function DeliveryItemDetailSheet({
  item,
  open,
  onOpenChange,
  onEntityUpdated,
}: DeliveryItemDetailSheetProps) {
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [extension, setExtension] = useState<FullExtension | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !item) {
      setProduct(null);
      setExtension(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const run = async () => {
      try {
        if (item.kind === 'PRODUCT') {
          const data = await productsApi.getById(item.product.id);
          if (!cancelled) setProduct(data);
        } else {
          const data = await extensionsApi.getById(item.extension.id);
          if (!cancelled) setExtension(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, item]);

  const title = item ? getItemLabel(item) : '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Stage gate timeline and delivery context. Full execution stays on the Product / Work
            Space screens.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!loading && product && (
            <ProductSheetBody product={product} onStatusChange={onEntityUpdated} />
          )}
          {!loading && extension && <ExtensionSheetBody extension={extension} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProductSheetBody({
  product,
  onStatusChange,
}: {
  product: FullProduct;
  onStatusChange: () => void;
}) {
  const lc = product.deliveryLifecycle;
  const nextStatuses = PRODUCT_NEXT[product.status] ?? [];
  const terminal = Boolean(lc?.isTerminal);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {lc && (
          <StatusBadge
            label={formatDeliveryLifecycleLabel(lc)}
            variant={getDeliveryLifecycleVariant(lc)}
          />
        )}
        <Link
          href={`/projects/${product.projectId}/products/${product.id}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Open product
        </Link>
      </div>
      <ProductStageGateSummary product={product} nextStatuses={nextStatuses} />
      <ProductDoneReadinessPanel readiness={product.doneReadiness} />
      {terminal && (
        <ClosedOutcomePanel
          resolution={lc?.resolution}
          cancellationReason={lc?.cancellationReason ?? null}
          clientAcceptedAt={product.clientAcceptedAt}
          clientAcceptanceNote={product.clientAcceptanceNote}
        />
      )}
      {!terminal && (
        <p className="text-muted-foreground text-xs">
          Stage transitions are disabled in this drawer — use the Product page for lifecycle
          actions.
        </p>
      )}
      <Button type="button" variant="secondary" size="sm" onClick={onStatusChange}>
        Refresh data
      </Button>
    </div>
  );
}

function ExtensionSheetBody({ extension }: { extension: FullExtension }) {
  const lc = extension.deliveryLifecycle;
  const terminal = Boolean(lc?.isTerminal);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {lc && (
          <StatusBadge
            label={formatDeliveryLifecycleLabel(lc)}
            variant={getDeliveryLifecycleVariant(lc)}
          />
        )}
        <Link
          href={`/projects/${extension.projectId}/products/${extension.productId}?tab=extensions`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Open on product
        </Link>
      </div>
      <ExtensionReadiness extension={extension} />
      {terminal && (
        <ClosedOutcomePanel
          resolution={lc?.resolution}
          cancellationReason={lc?.cancellationReason ?? null}
          clientAcceptedAt={null}
          clientAcceptanceNote={null}
        />
      )}
    </div>
  );
}

function ClosedOutcomePanel({
  resolution,
  cancellationReason,
  clientAcceptedAt,
  clientAcceptanceNote,
}: {
  resolution: 'DONE' | 'CANCELLED' | null | undefined;
  cancellationReason: string | null;
  clientAcceptedAt: string | null;
  clientAcceptanceNote: string | null;
}) {
  return (
    <div className="bg-muted/40 rounded-xl border p-3 text-sm">
      <p className="font-semibold">Closed outcome</p>
      <p className="text-muted-foreground mt-1 text-xs">Result: {resolution ?? '—'}</p>
      {resolution === 'CANCELLED' && cancellationReason && (
        <p className="mt-2 text-xs">Reason: {cancellationReason}</p>
      )}
      {resolution === 'DONE' && clientAcceptedAt && (
        <p className="mt-2 text-xs">
          Client accepted: {new Date(clientAcceptedAt).toLocaleString()}
        </p>
      )}
      {resolution === 'DONE' && clientAcceptanceNote && (
        <p className="mt-2 text-xs">Note: {clientAcceptanceNote}</p>
      )}
    </div>
  );
}
