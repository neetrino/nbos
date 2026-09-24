'use client';

import { useEffect, useState } from 'react';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';

/** Card list is slim; the sheet loads full copy when opened. */
export function useFunctionSheetDetail(
  openId: string | null,
  card: DeliveryFunctionOperationalDto | null,
): DeliveryFunctionOperationalDto | null {
  const [detail, setDetail] = useState<DeliveryFunctionOperationalDto | null>(card);
  const [seenId, setSeenId] = useState(openId);
  if (openId !== seenId) {
    setSeenId(openId);
    setDetail(card);
  }

  useEffect(() => {
    if (!openId) return;
    let cancelled = false;
    void deliveryFunctionsApi.get(openId).then((full) => {
      if (!cancelled) setDetail(full);
    });
    return () => {
      cancelled = true;
    };
  }, [openId]);

  return openId ? detail : null;
}
