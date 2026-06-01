'use client';

import { useMemo } from 'react';
import {
  CLIENT_SERVICE_STAGE_ORDER,
  clientServiceStageHex,
  clientServiceStageLabel,
} from '@/features/finance/constants/client-service-payment-stage';
import type { ClientServiceRecordListParams, ClientServiceStats } from '@/lib/api/client-services';
import { ClientServiceBoardScroll } from './ClientServiceBoardScroll';

interface ClientServiceStatusBoardViewProps {
  baseParams: ClientServiceRecordListParams;
  stats: ClientServiceStats | null;
  reloadToken: number;
  onOpen: (id: string) => void;
}

export function ClientServiceStatusBoardView({
  baseParams,
  stats,
  reloadToken,
  onOpen,
}: ClientServiceStatusBoardViewProps) {
  const columns = useMemo(
    () =>
      CLIENT_SERVICE_STAGE_ORDER.map((stage) => {
        const stat = stats?.byStage.find((entry) => entry.stage === stage);
        return {
          key: stage,
          label: clientServiceStageLabel(stage),
          hex: clientServiceStageHex(stage),
          count: stat?.count ?? 0,
          sum: stat?.sum ?? '0',
          params: { ...baseParams, stage },
        };
      }),
    [baseParams, stats],
  );

  return <ClientServiceBoardScroll columns={columns} reloadToken={reloadToken} onOpen={onOpen} />;
}
