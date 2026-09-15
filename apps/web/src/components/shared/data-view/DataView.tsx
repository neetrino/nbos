'use client';

import type { ReactNode } from 'react';
import { resolveDataViewState, type DataViewStateInput } from './data-view-state';

export interface DataViewRenderContext {
  /** True while data already on screen is being revalidated in the background. */
  revalidating: boolean;
}

export interface DataViewProps extends DataViewStateInput {
  /** First load, nothing to show yet. */
  loadingFallback: ReactNode;
  /** First load failed, nothing to show yet. */
  errorFallback: ReactNode;
  /** Load succeeded but returned nothing. */
  emptyFallback?: ReactNode;
  children: ReactNode | ((context: DataViewRenderContext) => ReactNode);
}

/**
 * Renders the loading / error / empty / ready branch of a data surface without
 * unmounting content that is already on screen.
 *
 * Replaces the `{loading ? <LoadingState /> : content}` pattern, which swaps the whole
 * surface for a skeleton on every refetch and makes a background refresh look like a
 * page reload. Once data exists this keeps rendering it and reports the in-flight
 * refresh through the render-callback form, so a save in an open sheet leaves the
 * screen behind it untouched.
 *
 * Renders no wrapper element, so it is layout-neutral inside flex and grid parents.
 */
export function DataView({
  loading,
  error = null,
  hasData,
  loadingFallback,
  errorFallback,
  emptyFallback = null,
  children,
}: DataViewProps): ReactNode {
  const state = resolveDataViewState({ loading, error, hasData });

  if (state === 'loading') return loadingFallback;
  if (state === 'error') return errorFallback;
  if (state === 'empty') return emptyFallback;

  return typeof children === 'function' ? children({ revalidating: loading }) : children;
}
