'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmDialog } from '@/components/shared';
import { ClientServiceDetailSheet } from '@/features/finance/components/client-services/ClientServiceDetailSheet';
import { ClientServiceListView } from '@/features/finance/components/client-services/ClientServiceListView';
import { ClientServiceMonthsBoardView } from '@/features/finance/components/client-services/ClientServiceMonthsBoardView';
import { ClientServiceStatusBoardView } from '@/features/finance/components/client-services/ClientServiceStatusBoardView';
import type { ClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { buildProductClientServiceListParams } from '@/features/projects/utils/build-product-client-service-list-params';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

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
  const serviceSheet = useProductEntityDetailSheet<ClientServiceRecord>();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [reloadToken, setReloadToken] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null);

  const baseParams = useMemo(
    () => buildProductClientServiceListParams(projectId, search, filters),
    [projectId, search, filters],
  );

  const refreshAll = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const handleOpen = useCallback(
    (service: ClientServiceRecord) => {
      serviceSheet.openEntity(service);
    },
    [serviceSheet],
  );

  const handleCreate = useCallback(() => {
    router.push('/finance/client-services');
  }, [router]);

  const handleCancelService = useCallback(
    async (id: string) => {
      try {
        await clientServicesApi.cancel(id);
        toast.success('Client service cancelled');
        if (serviceSheet.entityId === id) {
          serviceSheet.handleOpenChange(false);
        }
        refreshAll();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Client service could not be cancelled.'));
      }
    },
    [refreshAll, serviceSheet],
  );

  const boardViews = (
    <>
      {view === 'status' ? (
        <ClientServiceStatusBoardView
          baseParams={baseParams}
          reloadToken={reloadToken}
          onOpen={handleOpen}
        />
      ) : view === 'months' ? (
        <ClientServiceMonthsBoardView
          baseParams={baseParams}
          year={year}
          onYearChange={setYear}
          reloadToken={reloadToken}
          onOpen={handleOpen}
        />
      ) : (
        <ClientServiceListView
          baseParams={baseParams}
          reloadToken={reloadToken}
          onOpen={handleOpen}
          onCreate={handleCreate}
        />
      )}
    </>
  );

  return (
    <>
      {boardViews}

      <ClientServiceDetailSheet
        serviceId={serviceSheet.entityId}
        initialService={serviceSheet.seedEntity}
        open={serviceSheet.isOpen}
        onOpenChange={serviceSheet.handleOpenChange}
        onSaved={refreshAll}
        onRequestCancel={(target) => setCancelTarget(target)}
      />

      <DeleteConfirmDialog
        level="simple"
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        itemName={cancelTarget?.name ?? ''}
        title="Cancel client service?"
        description="The service will be marked cancelled and hidden from active lists. Linked finance records and history stay intact."
        onConfirm={() => {
          const id = cancelTarget?.id;
          if (!id) return;
          setCancelTarget(null);
          void handleCancelService(id);
        }}
      />
    </>
  );
}
