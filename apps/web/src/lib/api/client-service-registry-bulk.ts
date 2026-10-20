import { api } from '../api';
import type { ClientServiceRegistryCheckOutcome } from './client-services';

/** `skipped`: the card name is not a valid domain, so nothing was looked up. */
export type ClientServiceRegistryBulkOutcome = ClientServiceRegistryCheckOutcome | 'skipped';

export type ClientServiceRegistryBulkCounts = Record<ClientServiceRegistryBulkOutcome, number>;

export interface ClientServiceRegistryBulkPage {
  total: number;
  checked: number;
  nextCursor: string | null;
  done: boolean;
  counts: ClientServiceRegistryBulkCounts;
}

/** One page is capped at 12s on the API; the shared client timeout of 15s aborted the first run. */
const CHECK_ALL_REQUEST_TIMEOUT_MS = 20_000;

export const clientServiceRegistryBulkApi = {
  /** One time-boxed page of the "check all domains" run; pass `nextCursor` until `done`. */
  async checkPage(cursor: string | null): Promise<ClientServiceRegistryBulkPage> {
    const resp = await api.post<ClientServiceRegistryBulkPage>(
      '/api/client-services/actions/check-registry-all',
      { cursor },
      { timeout: CHECK_ALL_REQUEST_TIMEOUT_MS },
    );
    return resp.data;
  },
};
