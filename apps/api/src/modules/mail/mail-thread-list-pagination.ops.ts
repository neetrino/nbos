import {
  MAIL_THREAD_LIST_DEFAULT_PAGE_SIZE,
  MAIL_THREAD_LIST_MAX_PAGE,
  MAIL_THREAD_LIST_MAX_PAGE_SIZE,
} from './mail-thread-list-pagination.constants';

export function parseMailThreadListIntQuery(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) {
    return undefined;
  }
  return n;
}

export function normalizeMailThreadListPagination(input: { page?: number; pageSize?: number }): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const requestedPage = input.page ?? 1;
  const page =
    requestedPage >= 1 ? Math.min(Math.floor(requestedPage), MAIL_THREAD_LIST_MAX_PAGE) : 1;
  const requestedSize = input.pageSize ?? MAIL_THREAD_LIST_DEFAULT_PAGE_SIZE;
  const pageSize =
    requestedSize >= 1
      ? Math.min(Math.floor(requestedSize), MAIL_THREAD_LIST_MAX_PAGE_SIZE)
      : MAIL_THREAD_LIST_DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function buildMailThreadListPageMeta(params: {
  page: number;
  pageSize: number;
  totalCount: number;
}): {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const totalPages = params.totalCount === 0 ? 1 : Math.ceil(params.totalCount / params.pageSize);
  const hasNextPage = params.page < totalPages;
  const hasPreviousPage = params.page > 1;
  return {
    page: params.page,
    pageSize: params.pageSize,
    totalCount: params.totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}
