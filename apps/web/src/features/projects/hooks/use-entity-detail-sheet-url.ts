'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { DELIVERY_BOARD_OPEN_ITEM_QUERY } from '@/features/projects/constants/delivery-board-open-query';

function pushQueryParam(
  pathname: string,
  searchParams: URLSearchParams,
  router: ReturnType<typeof useRouter>,
  key: string,
  value: string | null,
) {
  const next = new URLSearchParams(searchParams.toString());
  if (value) next.set(key, value);
  else next.delete(key);
  const qs = next.toString();
  router.push(qs ? `${pathname}?${qs}` : pathname);
}

/** Opens delivery / deal sheets on the current route via query params (same UX as board + CRM). */
export function useEntityDetailSheetUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openDeliveryItemKey = searchParams.get(DELIVERY_BOARD_OPEN_ITEM_QUERY)?.trim() || null;
  const openDealId = searchParams.get(CRM_OPEN_DEAL_QUERY)?.trim() || null;

  const openDeliveryItem = useCallback(
    (itemKey: string) => {
      pushQueryParam(pathname, searchParams, router, DELIVERY_BOARD_OPEN_ITEM_QUERY, itemKey);
    },
    [pathname, router, searchParams],
  );

  const closeDeliveryItem = useCallback(() => {
    pushQueryParam(pathname, searchParams, router, DELIVERY_BOARD_OPEN_ITEM_QUERY, null);
  }, [pathname, router, searchParams]);

  const openDeal = useCallback(
    (dealId: string) => {
      pushQueryParam(pathname, searchParams, router, CRM_OPEN_DEAL_QUERY, dealId);
    },
    [pathname, router, searchParams],
  );

  const closeDeal = useCallback(() => {
    pushQueryParam(pathname, searchParams, router, CRM_OPEN_DEAL_QUERY, null);
  }, [pathname, router, searchParams]);

  return {
    openDeliveryItemKey,
    openDealId,
    openDeliveryItem,
    closeDeliveryItem,
    openDeal,
    closeDeal,
  };
}
