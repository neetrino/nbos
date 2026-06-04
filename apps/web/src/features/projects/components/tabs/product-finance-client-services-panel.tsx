'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClientServiceListView } from '@/features/finance/components/client-services/ClientServiceListView';
import { ClientServiceMonthsBoardView } from '@/features/finance/components/client-services/ClientServiceMonthsBoardView';
import { ClientServiceStatusBoardView } from '@/features/finance/components/client-services/ClientServiceStatusBoardView';
import type { ClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { clientServicesListWithOpenServiceHref } from '@/features/finance/constants/client-service-deep-link';
import { buildProductClientServiceListParams } from '@/features/projects/utils/build-product-client-service-list-params';
import { clientServicesApi, type ClientServiceStats } from '@/lib/api/client-services';

interface ProductFinanceClientServicesPanelProps {
  projectId: string;
  search: string;
  filters: Record<string, string>;
  view: ClientServicesViewMode;
}

export function ProductFinanceClientServicesPanel({
  projectId,
  search,
  filters,
  view,
}: ProductFinanceClientServicesPanelProps) {
  const router = useRouter();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [reloadToken, setReloadToken] = useState(0);
  const [stats, setStats] = useState<ClientServiceStats | null>(null);

  const baseParams = useMemo(
    () => buildProductClientServiceListParams(projectId, search, filters),
    [projectId, search, filters],
  );

  const needsStats = view === 'status' || view === 'months';

  const statsParams = useMemo(
    () => ({
      projectId,
      type: baseParams.type,
      status: baseParams.status,
      billingModel: baseParams.billingModel,
      year,
    }),
    [baseParams.billingModel, baseParams.status, baseParams.type, projectId, year],
  );

  useEffect(() => {
    if (!needsStats) return;

    let active = true;
    void clientServicesApi
      .getStats(statsParams)
      .then((next) => {
        if (active) setStats(next);
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, [needsStats, statsParams, reloadToken]);

  const handleOpen = useCallback(
    (serviceId: string) => {
      router.push(clientServicesListWithOpenServiceHref(serviceId));
    },
    [router],
  );

  const handleCreate = useCallback(() => {
    router.push('/finance/client-services');
  }, [router]);

  if (view === 'status') {
    return (
      <ClientServiceStatusBoardView
        baseParams={baseParams}
        stats={stats}
        reloadToken={reloadToken}
        onOpen={handleOpen}
      />
    );
  }

  if (view === 'months') {
    return (
      <ClientServiceMonthsBoardView
        baseParams={baseParams}
        stats={stats}
        year={year}
        onYearChange={setYear}
        reloadToken={reloadToken}
        onOpen={handleOpen}
      />
    );
  }

  return (
    <ClientServiceListView
      baseParams={baseParams}
      reloadToken={reloadToken}
      onOpen={handleOpen}
      onCreate={handleCreate}
    />
  );
}
