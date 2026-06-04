'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClientServiceListView } from '@/features/finance/components/client-services/ClientServiceListView';
import { ClientServiceMonthsBoardView } from '@/features/finance/components/client-services/ClientServiceMonthsBoardView';
import { ClientServiceStatusBoardView } from '@/features/finance/components/client-services/ClientServiceStatusBoardView';
import type { ClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { clientServicesListWithOpenServiceHref } from '@/features/finance/constants/client-service-deep-link';
import { buildProductClientServiceListParams } from '@/features/projects/utils/build-product-client-service-list-params';
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

  const baseParams = useMemo(
    () => buildProductClientServiceListParams(projectId, search, filters),
    [projectId, search, filters],
  );

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
        reloadToken={reloadToken}
        onOpen={handleOpen}
      />
    );
  }

  if (view === 'months') {
    return (
      <ClientServiceMonthsBoardView
        baseParams={baseParams}
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
