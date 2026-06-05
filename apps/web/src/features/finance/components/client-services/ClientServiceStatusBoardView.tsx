'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import {
  CLIENT_SERVICE_STAGE_ORDER,
  clientServiceStageHex,
  clientServiceStageLabel,
} from '@/features/finance/constants/client-service-payment-stage';
import type { ClientServiceRecordListParams } from '@/lib/api/client-services';
import { ClientServiceBoardScroll } from './ClientServiceBoardScroll';
import { useClientServiceBoard } from './use-client-service-board';

interface ClientServiceStatusBoardViewProps {
  baseParams: ClientServiceRecordListParams;
  reloadToken: number;
  onOpen: (service: ClientServiceRecord) => void;
}

export function ClientServiceStatusBoardView({
  baseParams,
  reloadToken,
  onOpen,
}: ClientServiceStatusBoardViewProps) {
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
        label: clientServiceStageLabel(stage),
        hex: clientServiceStageHex(stage),
        count: column?.count ?? 0,
        sum: column?.sum ?? '0',
        params: { ...baseParams, stage },
        seed: column ? { items: column.items, total: column.meta.total } : { items: [], total: 0 },
      };
    });
  }, [baseParams, board]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} />;

  return <ClientServiceBoardScroll columns={columns} reloadToken={reloadToken} onOpen={onOpen} />;
}
