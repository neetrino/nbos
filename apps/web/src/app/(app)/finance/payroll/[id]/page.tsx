'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ErrorState } from '@/components/shared';
import { PayrollRunDetailPageContent } from '@/features/finance/components/payroll/PayrollRunDetailPageContent';
import { payrollRunDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollRunsApi, type PayrollRunDetail } from '@/lib/api/payroll-runs';

export default function PayrollRunDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [run, setRun] = useState<PayrollRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFinanceDocumentTitle(payrollRunDetailPageTitle(run?.payrollMonth));

  const load = useCallback(async () => {
    if (!id) return;
    const data = await payrollRunsApi.getById(id);
    setRun(data);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void load()
      .catch((caught) => {
        setRun(null);
        setError(getApiErrorMessage(caught, 'Payroll run could not be loaded.'));
      })
      .finally(() => setLoading(false));
  }, [id, load]);

  if (!id) {
    return <ErrorState description="Invalid payroll run." />;
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
