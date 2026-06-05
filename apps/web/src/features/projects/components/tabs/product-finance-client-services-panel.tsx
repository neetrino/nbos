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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await clientServicesApi.delete(id);
        if (serviceSheet.entityId === id) {
          serviceSheet.handleOpenChange(false);
        }
        refreshAll();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Client service could not be deleted.'));
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
        onRequestDelete={(target) => setDeleteTarget(target)}
      />

      <DeleteConfirmDialog
        level="simple"
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        itemName={deleteTarget?.name ?? ''}
        title="Delete client service?"
        description="Linked finance records and history stay in the system."
        onConfirm={() => {
          const id = deleteTarget?.id;
          if (!id) return;
          setDeleteTarget(null);
          void handleDelete(id);
        }}
      />
    </>
  );
}
