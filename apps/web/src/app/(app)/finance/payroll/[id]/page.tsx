'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/shared';
import { PayrollRunDetailPageContent } from '@/features/finance/components/payroll/PayrollRunDetailPageContent';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollRunsApi, type PayrollRunDetail } from '@/lib/api/payroll-runs';

export default function PayrollRunDetailPage() {
  const t = useTranslations('payroll');
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [run, setRun] = useState<PayrollRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFinanceDocumentTitle(
    run?.payrollMonth
      ? t('detail.pageTitleMonth', { month: run.payrollMonth })
      : t('detail.pageTitle'),
  );

  const load = useCallback(async () => {
    if (!id) return;
    const data = await payrollRunsApi.getById(id);
    setRun(data);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch (caught) {
        if (cancelled) return;
        setRun(null);
        setError(getApiErrorMessage(caught, t('detail.loadError')));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, load, t]);

  if (!id) {
    return <ErrorState description={t('detail.invalid')} />;
  }

  return (
    <PayrollRunDetailPageContent
      payrollRunId={id}
      initialRun={run}
      initialError={error}
      initialLoading={loading}
      onReload={load}
    />
  );
}
