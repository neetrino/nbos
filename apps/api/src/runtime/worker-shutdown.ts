const DEFAULT_SHUTDOWN_TIMEOUT_MS = 45_000;

export type ShutdownStep = {
  name: string;
  run: () => Promise<void>;
};

/**
 * Ordered graceful shutdown with timeout. Does not call process.exit internally.
 * Returns false when timeout exceeded (caller may exit non-zero).
 */
export async function runGracefulShutdown(
  steps: readonly ShutdownStep[],
  options: {
    timeoutMs?: number;
    log: (message: string) => void;
    onTimeout?: () => void;
  },
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    options.log(`Shutdown timeout after ${timeoutMs}ms`);
    options.onTimeout?.();
  }, timeoutMs);

  try {
    for (const step of steps) {
      if (timedOut) return false;
      options.log(`Shutdown step: ${step.name}`);
      await step.run();
    }
    return !timedOut;
  } finally {
    clearTimeout(timer);
  }
}

export { DEFAULT_SHUTDOWN_TIMEOUT_MS };
