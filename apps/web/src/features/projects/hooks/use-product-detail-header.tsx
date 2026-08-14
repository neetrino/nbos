'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useHeaderContext, useHeaderModuleTitle } from '@/components/layout/header-context';
import { usePageDocumentTitle } from '@/features/account/hooks/use-page-document-title';
import { ProductDetailHeader } from '@/features/projects/components/ProductDetailHeader';
import type { FullProduct, Product } from '@/lib/api/products';

interface UseProductDetailHeaderOptions {
  product: FullProduct | null;
  siblingProducts: Product[];
  projectId: string;
  onProductUpdated: (product: FullProduct) => void;
}

/** Product identity, stage status, and switcher in the app top bar. */
export function useProductDetailHeader({
  product,
  siblingProducts,
  projectId,
  onProductUpdated,
}: UseProductDetailHeaderOptions): void {
  const router = useRouter();
  useHeaderModuleTitle(null);
  usePageDocumentTitle(product?.name ?? '');

  const onSelectProduct = useCallback(
    (nextProductId: string) => {
      router.push(`/projects/${projectId}/products/${nextProductId}`);
    },
    [projectId, router],
  );

  const headerContext = useMemo(() => {
    if (!product) return null;
    return {
      kind: 'custom' as const,
      node: (
        <ProductDetailHeader
          product={product}
          siblingProducts={siblingProducts}
          projectHref={`/projects/${projectId}`}
          onSelectProduct={onSelectProduct}
          onProductUpdated={onProductUpdated}
        />
      ),
    };
  }, [onProductUpdated, onSelectProduct, product, projectId, siblingProducts]);

  useHeaderContext(headerContext);
}
