/** Branch a data surface renders while it loads, fails, or has content. */
export type DataViewState = 'loading' | 'error' | 'empty' | 'ready';

export interface DataViewStateInput {
  /** True while a fetch is in flight. */
  loading: boolean;
  /** Load failure message, when the last fetch rejected. */
  error?: string | null;
  /** True when the surface already holds renderable data. */
  hasData: boolean;
}

/**
 * Resolves which branch a data surface renders, keeping loaded content mounted.
 *
 * Once `hasData` is true the surface stays `ready`: a revalidation in flight, or a
 * revalidation that failed, never swaps content for a skeleton or an error screen.
 * Those branches are reserved for the first load, when there is nothing to show yet.
 * Callers surface an in-flight refresh through {@link isRevalidating} and a failed
 * refresh through a non-destructive banner.
 */
export function resolveDataViewState({
  loading,
  error = null,
  hasData,
}: DataViewStateInput): DataViewState {
  if (hasData) return 'ready';
  if (loading) return 'loading';
  if (error) return 'error';
  return 'empty';
}

/** True when a fetch is revalidating data that is already on screen. */
export function isRevalidating({ loading, hasData }: Omit<DataViewStateInput, 'error'>): boolean {
  return loading && hasData;
}
