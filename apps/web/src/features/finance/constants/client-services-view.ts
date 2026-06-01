export type ClientServicesViewMode = 'list' | 'status' | 'months';

const STORAGE_KEY = 'nbos:finance:client-services-view';

export function readClientServicesViewMode(): ClientServicesViewMode {
  if (typeof window === 'undefined') return 'list';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'status' || raw === 'months') return raw;
  return 'list';
}

export function writeClientServicesViewMode(mode: ClientServicesViewMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}
