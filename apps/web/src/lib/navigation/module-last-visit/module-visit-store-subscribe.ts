const MODULE_VISIT_STORE_EVENT = 'nbos:module-visit-store';

/** Notify sidebar href hooks after localStorage last-visit updates. */
export function notifyModuleVisitStoreChange(): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }
  window.dispatchEvent(new Event(MODULE_VISIT_STORE_EVENT));
}

/** Subscribe to module last-visit storage changes (same-tab + cross-tab). */
export function subscribeModuleVisitStore(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === 'nbos:module-last-visit' || event.key === 'nbos:finance:zone-last-href') {
      onStoreChange();
    }
  };
  if (typeof window.addEventListener === 'function') {
    window.addEventListener(MODULE_VISIT_STORE_EVENT, onStoreChange);
    window.addEventListener('storage', onStorage);
  }
  return () => {
    if (typeof window.removeEventListener !== 'function') return;
    window.removeEventListener(MODULE_VISIT_STORE_EVENT, onStoreChange);
    window.removeEventListener('storage', onStorage);
  };
}
