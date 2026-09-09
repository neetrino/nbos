type RegistryRefreshListener = () => void;

const listeners = new Set<RegistryRefreshListener>();

export function subscribeClientServiceRegistryRefresh(
  listener: RegistryRefreshListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyClientServiceRegistryRefresh(): void {
  for (const listener of listeners) listener();
}
