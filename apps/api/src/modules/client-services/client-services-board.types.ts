import type { ClientServicePaymentStage } from './client-service-payment-stage';
import type { ClientServiceRecordQueryParams } from './client-services.types';

export type ClientServiceBoardView = 'status' | 'months';

export interface ClientServiceBoardQueryParams extends Omit<
  ClientServiceRecordQueryParams,
  'page' | 'stage' | 'renewalFrom' | 'renewalTo' | 'year'
> {
  view: ClientServiceBoardView;
  year?: number;
}

export interface ClientServiceBoardColumnPayload {
  key: string;
  count: number;
  sum: string;
  items: unknown[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface ClientServiceBoardPayload {
  view: ClientServiceBoardView;
  year: number;
  columns: ClientServiceBoardColumnPayload[];
}

export const CLIENT_SERVICE_BOARD_STATUS_ORDER: readonly ClientServicePaymentStage[] = [
  'pay_now',
  'invoice',
  'upcoming',
  'active',
];

export const CLIENT_SERVICE_BOARD_DEFAULT_PAGE_SIZE = 20;
