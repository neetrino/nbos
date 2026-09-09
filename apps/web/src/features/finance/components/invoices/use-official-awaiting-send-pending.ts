'use client';

import { useEffect, useRef, useState } from 'react';
import type { Invoice } from '@/lib/api/finance';
import {
  isOfficialAwaitingSendPending,
  subscribeOfficialAwaitingSendPending,
} from './official-awaiting-send-pending';
import {
  didEnterAwaitingPayment,
  OFFICIAL_AWAITING_SEND_PENDING_TIMEOUT_MS,
} from './official-request-panel-constants';

export function useOfficialAwaitingSendPending(invoice: Invoice): boolean {
  const [storePending, setStorePending] = useState(() => isOfficialAwaitingSendPending(invoice.id));
  const [transitionPending, setTransitionPending] = useState(false);
  const previousStatusRef = useRef(invoice.moneyStatus);
  const invoiceIdRef = useRef(invoice.id);

  useEffect(() => {
    const sync = () => setStorePending(isOfficialAwaitingSendPending(invoice.id));
    sync();
    return subscribeOfficialAwaitingSendPending(sync);
  }, [invoice.id]);

  useEffect(() => {
    if (invoiceIdRef.current !== invoice.id) {
      invoiceIdRef.current = invoice.id;
      previousStatusRef.current = invoice.moneyStatus;
      setTransitionPending(false);
      return;
    }
    if (invoice.officialInvoiceRequestSent) {
      setTransitionPending(false);
      previousStatusRef.current = invoice.moneyStatus;
      return;
    }
    const previous = previousStatusRef.current;
    previousStatusRef.current = invoice.moneyStatus;
    if (invoice.taxStatus === 'TAX' && didEnterAwaitingPayment(previous, invoice.moneyStatus)) {
      setTransitionPending(true);
    }
  }, [invoice.id, invoice.moneyStatus, invoice.officialInvoiceRequestSent, invoice.taxStatus]);

  useEffect(() => {
    if (!transitionPending) return;
    const timeoutId = window.setTimeout(() => {
      setTransitionPending(false);
    }, OFFICIAL_AWAITING_SEND_PENDING_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [transitionPending]);

  return !invoice.officialInvoiceRequestSent && (storePending || transitionPending);
}
