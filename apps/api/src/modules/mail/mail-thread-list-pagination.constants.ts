/** Default page size for `GET /api/mail/threads` (matches prior hard-coded take). */
export const MAIL_THREAD_LIST_DEFAULT_PAGE_SIZE = 50;

export const MAIL_THREAD_LIST_MAX_PAGE_SIZE = 100;

/** Upper bound on `page` to avoid pathological skip values. */
export const MAIL_THREAD_LIST_MAX_PAGE = 1000;
