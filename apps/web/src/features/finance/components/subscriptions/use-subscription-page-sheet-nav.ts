'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { OPEN_SUBSCRIPTION_QUERY } from '@/features/finance/constants/subscription-deep-link';

const SUBSCRIPTIONS_PATH = '/finance/subscriptions';

export function useSubscriptionPageSheetNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listPath = pathname ?? SUBSCRIPTIONS_PATH;

  const replaceListUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${listPath}?${qs}` : listPath);
    },
    [listPath, router, searchParams],
  );

  const pushListUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      router.push(`${listPath}?${params.toString()}`);
    },
    [listPath, router, searchParams],
  );

  const openSubscriptionDetail = useCallback(
    (subscriptionId: string) => {
      pushListUrl((params) => {
        params.delete(OPEN_INVOICE_QUERY);
        params.set(OPEN_SUBSCRIPTION_QUERY, subscriptionId);
      });
    },
    [pushListUrl],
  );

  const openInvoiceDetail = useCallback(
    (invoiceId: string) => {
      pushListUrl((params) => {
        params.set(OPEN_INVOICE_QUERY, invoiceId);
      });
    },
    [pushListUrl],
  );

  const handleOpenMonthCell = useCallback(
    ({ subscriptionId, invoiceId }: { subscriptionId: string; invoiceId: string | null }) => {
      if (invoiceId) {
        openInvoiceDetail(invoiceId);
        return;
      }
      openSubscriptionDetail(subscriptionId);
    },
    [openInvoiceDetail, openSubscriptionDetail],
  );

  const handleSubscriptionSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      replaceListUrl((params) => {
        params.delete(OPEN_SUBSCRIPTION_QUERY);
      });
    },
    [replaceListUrl],
  );

  const handleInvoiceSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      replaceListUrl((params) => {
        params.delete(OPEN_INVOICE_QUERY);
      });
    },
    [replaceListUrl],
  );

  return {
    openSubscriptionIdFromUrl: searchParams.get(OPEN_SUBSCRIPTION_QUERY)?.trim() || null,
    openInvoiceIdFromUrl: searchParams.get(OPEN_INVOICE_QUERY)?.trim() || null,
    openSubscriptionDetail,
    handleOpenMonthCell,
    handleSubscriptionSheetOpenChange,
    handleInvoiceSheetOpenChange,
  };
}
