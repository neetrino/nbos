/** Whether the Project Hub directory can fetch another page. */
export function projectsHubHasMore(loadedCount: number, total: number): boolean {
  return loadedCount < total;
}
