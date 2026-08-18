'use client';

import { useEffect, useState } from 'react';
import { productWhatsAppApi } from '@/lib/api/whatsapp';

export function ProductWhatsAppOperationHistory({
  productId,
  open,
  revision,
}: {
  productId: string;
  open: boolean;
  revision?: string;
}) {
  const [items, setItems] = useState<
    Array<{ id: string; type: string; status: string; createdAt: string; errorCode: string | null }>
  >([]);

  useEffect(() => {
    if (!open) return;
    void productWhatsAppApi
      .operations(productId)
      .then((result) => setItems(result.items.slice(0, 10)))
      .catch(() => setItems([]));
  }, [open, productId, revision]);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No operations yet.</p>;
  }

  return (
    <ul className="space-y-1.5 text-xs">
      {items.map((item) => (
        <li key={item.id} className="border-border bg-muted/30 rounded-lg border px-2.5 py-2">
          <span className="text-foreground font-medium">{item.type}</span>
          <span className="text-muted-foreground"> · {item.status}</span>
          {item.errorCode ? <span className="text-destructive"> · {item.errorCode}</span> : null}
          <div className="text-muted-foreground mt-0.5">{item.createdAt}</div>
        </li>
      ))}
    </ul>
  );
}
