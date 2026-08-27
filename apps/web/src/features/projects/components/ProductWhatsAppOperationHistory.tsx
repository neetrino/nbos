'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Clock3, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { productWhatsAppApi } from '@/lib/api/whatsapp';
import {
  formatProductWhatsAppTimestamp,
  RECENT_OPERATIONS_PREVIEW_COUNT,
  WA_SECTION_CARD,
} from './product-whatsapp-settings-ui';

interface OperationItem {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  errorCode: string | null;
}

export function ProductWhatsAppOperationHistory({
  productId,
  open,
  revision,
}: {
  productId: string;
  open: boolean;
  revision?: string;
}) {
  const [items, setItems] = useState<OperationItem[]>([]);
  const listKey = `${productId}:${revision ?? ''}`;
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const expanded = expandedKey === listKey;

  useEffect(() => {
    if (!open) return;
    void productWhatsAppApi
      .operations(productId)
      .then((result) => setItems(result.items.slice(0, 10)))
      .catch(() => setItems([]));
  }, [open, productId, revision]);

  const visibleItems = expanded ? items : items.slice(0, RECENT_OPERATIONS_PREVIEW_COUNT);
  const canExpand = items.length > RECENT_OPERATIONS_PREVIEW_COUNT;

  return (
    <section className={WA_SECTION_CARD}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <h4 className="text-foreground text-sm font-semibold">Recent operations</h4>
        </div>
        {canExpand ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-emerald-600 dark:text-emerald-400"
            onClick={() => setExpandedKey(expanded ? null : listKey)}
          >
            {expanded ? 'Show less' : 'View all'}
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <PackageOpen className="text-muted-foreground/40 size-12" aria-hidden />
          <p className="text-muted-foreground max-w-[16rem] text-sm">
            No operations yet. All your group actions will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5 text-xs">
          {visibleItems.map((item) => (
            <li key={item.id} className="border-border bg-muted/30 rounded-lg border px-2.5 py-2">
              <span className="text-foreground font-medium">{item.type}</span>
              <span className="text-muted-foreground"> · {item.status}</span>
              {item.errorCode ? (
                <span className="text-destructive"> · {item.errorCode}</span>
              ) : null}
              <div className="text-muted-foreground mt-0.5">
                {formatProductWhatsAppTimestamp(item.createdAt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
