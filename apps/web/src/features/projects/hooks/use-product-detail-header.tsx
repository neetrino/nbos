'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useHeaderContext } from '@/components/layout/header-context';
import { usePageDocumentTitle } from '@/features/account/hooks/use-page-document-title';
import { ProductDetailHeader } from '@/features/projects/components/ProductDetailHeader';
import type { FullProduct, Product } from '@/lib/api/products';

/** Product identity, stage status, and switcher in the app top bar. */
export function useProductDetailHeader(
  product: FullProduct | null,
  siblingProducts: Product[],
  projectId: string,
): void {
  const router = useRouter();
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
          onSelectProduct={onSelectProduct}
        />
      ),
    };
  }, [onSelectProduct, product, siblingProducts]);

  useHeaderContext(headerContext);
}
