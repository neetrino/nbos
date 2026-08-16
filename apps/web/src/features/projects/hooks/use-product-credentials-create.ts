'use client';

import { useCallback, useState } from 'react';
import { UNIVERSAL_ACCESS_SLOT_KEY } from '@nbos/shared';
import type { CredentialDetail } from '@/lib/api/credentials';
import { productsApi, type ProductAccessSlotBindMeta } from '@/lib/api/products';
import { toast } from 'sonner';

function toastCreateAndBindSuccess(meta: ProductAccessSlotBindMeta | undefined) {
  if (
    meta &&
    meta.requestedSlotKey === UNIVERSAL_ACCESS_SLOT_KEY &&
    meta.effectiveSlotKey !== UNIVERSAL_ACCESS_SLOT_KEY
  ) {
    toast.success(`Saved to Credentials — filed under ${meta.effectiveSlotLabel}`);
    return;
  }
  toast.success('Saved to Credentials and linked');
}

export interface UseProductCredentialsCreateOptions {
  productId: string;
  productName: string;
  refetch: () => Promise<void>;
}

export function useProductCredentialsCreate({
  productId,
  productName,
  refetch,
}: UseProductCredentialsCreateOptions) {
  const [createOpen, setCreateOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string | undefined>();

  const openCreate = useCallback(() => {
    setInitialCategory(undefined);
    setCreateOpen(true);
  }, []);

  const openCreateInCategory = useCallback((category: string) => {
    setInitialCategory(category);
    setCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    setInitialCategory(undefined);
  }, []);

  const handleCreated = useCallback(
    async (created: CredentialDetail) => {
      try {
        const res = await productsApi.bindAccessSlot(productId, {
          slotKey: UNIVERSAL_ACCESS_SLOT_KEY,
          credentialId: created.id,
        });
        toastCreateAndBindSuccess(res.bindMeta);
      } catch {
        toast.error('Credential was created but could not be linked to this product.');
      }
      await refetch();
    },
    [productId, refetch],
  );

  const credentialName = productName.trim() || 'Credential';

  return {
    createOpen,
    initialCategory,
    credentialName,
    openCreate,
    openCreateInCategory,
    closeCreate,
    handleCreated,
  };
}
