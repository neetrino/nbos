/** Default page size for `GET /api/tasks`. */
export const TASK_LIST_DEFAULT_PAGE_SIZE = 20;

/** Upper bound for `GET /api/tasks` `pageSize` to limit accidental huge reads. */
export const TASK_LIST_MAX_PAGE_SIZE = 200;
