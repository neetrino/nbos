'use client';

import { useMemo } from 'react';
import { DataView, LoadingState, QueryLoadError } from '@/components/shared';
import {
  CLIENT_SERVICE_STAGE_ORDER,
  clientServiceStageHex,
} from '@/features/finance/constants/client-service-payment-stage';
import type { ClientServiceRecord, ClientServiceRecordListParams } from '@/lib/api/client-services';
import { ClientServiceBoardScroll } from './ClientServiceBoardScroll';
import { translateClientServiceStage, useClientServicesT } from './client-service-message-keys';
import { useClientServiceBoard } from './use-client-service-board';

interface ClientServiceStatusBoardViewProps {
  baseParams: ClientServiceRecordListParams;
  reloadToken: number;
  onOpen: (service: ClientServiceRecord) => void;
  canRunRegistryCheck?: boolean;
}

export function ClientServiceStatusBoardView({
  baseParams,
  reloadToken,
  onOpen,
  canRunRegistryCheck = false,
}: ClientServiceStatusBoardViewProps) {
  const t = useClientServicesT();
  const year = new Date().getUTCFullYear();
  const { board, loading, error } = useClientServiceBoard({
    view: 'status',
    baseParams,
    year,
    reloadToken,
  });

  const columns = useMemo(() => {
    const byKey = new Map(board?.columns.map((column) => [column.key, column]));
    return CLIENT_SERVICE_STAGE_ORDER.map((stage) => {
      const column = byKey.get(stage);
      return {
        key: stage,
        label: translateClientServiceStage(t, stage),
        hex: clientServiceStageHex(stage),
        count: column?.count ?? 0,
        sum: column?.sum ?? '0',
        params: { ...baseParams, stage },
        seed: column ? { items: column.items, total: column.meta.total } : { items: [], total: 0 },
      };
    });
  }, [baseParams, board, t]);

  return (
    <DataView
      loading={loading}
      error={error}
      hasData={board !== null}
      loadingFallback={<LoadingState />}
      errorFallback={<QueryLoadError description={error ?? ''} />}
      emptyFallback={
        <ClientServiceBoardScroll
          columns={columns}
          reloadToken={reloadToken}
          onOpen={onOpen}
          canRunRegistryCheck={canRunRegistryCheck}
        />
      }
    >
      <ClientServiceBoardScroll
        columns={columns}
        reloadToken={reloadToken}
        onOpen={onOpen}
        canRunRegistryCheck={canRunRegistryCheck}
      />
    </DataView>
  );
}
