export class SearcherTimeoutError extends Error {
  constructor(message = 'Search timed out') {
    super(message);
    this.name = 'SearcherTimeoutError';
  }
}

/** Rejects when `promise` does not settle within `timeoutMs`. */
export function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new SearcherTimeoutError());
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
