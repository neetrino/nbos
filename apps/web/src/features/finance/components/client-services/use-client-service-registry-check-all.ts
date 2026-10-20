'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { clientServiceRegistryBulkApi } from '@/lib/api/client-service-registry-bulk';
import { getApiErrorMessage } from '@/lib/api-errors';
import { notifyClientServiceRegistryRefresh } from './client-service-registry-events';
import {
  runClientServiceRegistryCheckAll,
  type RegistryCheckAllSummary,
} from './client-service-registry-check-all';
import { useClientServicesT, type ClientServicesTranslate } from './client-service-message-keys';

type ToastId = string | number;

/** Runs the paged "check all domains" job with a live progress toast. Stops on unmount. */
export function useClientServiceRegistryCheckAll(): { running: boolean; start: () => void } {
  const t = useClientServicesT();
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    const toastId = toast.loading(t('registry.bulk.starting'));
    try {
      const summary = await runClientServiceRegistryCheckAll({
        fetchPage: (cursor) => clientServiceRegistryBulkApi.checkPage(cursor),
        onProgress: (progress) => {
          toast.loading(t('registry.bulk.progress', { ...progress }), { id: toastId });
        },
        isCancelled: () => !mountedRef.current,
      });
      showRegistryCheckAllSummary(t, summary, toastId);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t('registry.bulk.error')), { id: toastId });
    } finally {
      runningRef.current = false;
      if (mountedRef.current) setRunning(false);
      notifyClientServiceRegistryRefresh();
    }
  }, [t]);

  const start = useCallback(() => {
    void run();
  }, [run]);

  return { running, start };
}

function showRegistryCheckAllSummary(
  t: ClientServicesTranslate,
  summary: RegistryCheckAllSummary,
  toastId: ToastId,
): void {
  if (summary.cancelled) {
    toast.dismiss(toastId);
    return;
  }
  if (summary.total === 0) {
    toast.info(t('registry.bulk.empty'), { id: toastId });
    return;
  }
  const { counts } = summary;
  const noData = counts.no_expiry + counts.failed + counts.skipped;
  const message = t('registry.bulk.done', {
    checked: summary.checked,
    updated: counts.updated + counts.corrected,
    unchanged: counts.unchanged,
    notFound: counts.not_found,
    noData,
  });
  if (counts.not_found + noData > 0) toast.warning(message, { id: toastId });
  else toast.success(message, { id: toastId });
}
