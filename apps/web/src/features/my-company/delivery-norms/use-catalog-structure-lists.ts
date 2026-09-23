import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  deliveryCatalogStructureApi,
  type CoreItemDto,
  type FunctionCollectionDto,
} from '@/lib/api/delivery-catalog-structure';
import { isAccessRevokedApiError } from '@/lib/api-errors';
import { messageFromCaught } from './message-from-caught';

const EMPTY_CORE_ITEMS: CoreItemDto[] = [];
const EMPTY_COLLECTIONS: FunctionCollectionDto[] = [];

export function useCoreItems(
  profileVersionId: string | null,
  seededItems?: readonly CoreItemDto[],
) {
  const t = useTranslations('hr.deliveryNorms');
  const hasSeed = seededItems !== undefined;
  const [items, setItems] = useState<CoreItemDto[]>(
    seededItems ? [...seededItems] : EMPTY_CORE_ITEMS,
  );
  const [loading, setLoading] = useState(!hasSeed && profileVersionId !== null);
  const [error, setError] = useState<string | null>(null);
  const [seenSeed, setSeenSeed] = useState(seededItems);
  const fallback = t('errors.load');
  if (hasSeed && seededItems !== seenSeed) {
    setSeenSeed(seededItems);
    setItems([...seededItems]);
    setLoading(false);
  }

  const load = useCallback(async () => {
    if (profileVersionId === null) {
      setItems(EMPTY_CORE_ITEMS);
      setError(null);
      setLoading(false);
      return;
    }
    if (!hasSeed) setLoading(true);
    try {
      setItems(await deliveryCatalogStructureApi.listCoreItems(profileVersionId));
      setError(null);
    } catch (caught) {
      if (isAccessRevokedApiError(caught)) {
        setItems(EMPTY_CORE_ITEMS);
      }
      setError(messageFromCaught(caught, fallback));
    } finally {
      setLoading(false);
    }
  }, [fallback, hasSeed, profileVersionId]);

  useEffect(() => {
    if (hasSeed) return;
    void load();
  }, [hasSeed, load]);

  return { items, loading, error, load };
}

export function useFunctionCollections(productType: string | null) {
  const t = useTranslations('hr.deliveryNorms');
  const [collections, setCollections] = useState<FunctionCollectionDto[]>(EMPTY_COLLECTIONS);
  const [loading, setLoading] = useState(productType !== null);
  const [error, setError] = useState<string | null>(null);
  const fallback = t('errors.load');

  const load = useCallback(async () => {
    if (productType === null) {
      setCollections(EMPTY_COLLECTIONS);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCollections(await deliveryCatalogStructureApi.listCollections(productType));
      setError(null);
    } catch (caught) {
      if (isAccessRevokedApiError(caught)) {
        setCollections(EMPTY_COLLECTIONS);
      }
      setError(messageFromCaught(caught, fallback));
    } finally {
      setLoading(false);
    }
  }, [fallback, productType]);

  useEffect(() => {
    void load();
  }, [load]);

  return { collections, loading, error, load };
}
