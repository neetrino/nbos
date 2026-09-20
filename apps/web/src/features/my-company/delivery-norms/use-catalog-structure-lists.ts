import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  deliveryCatalogStructureApi,
  type CoreItemDto,
  type SizePresetDto,
} from '@/lib/api/delivery-catalog-structure';
import { isAccessRevokedApiError } from '@/lib/api-errors';
import { messageFromCaught } from './message-from-caught';

const EMPTY_CORE_ITEMS: CoreItemDto[] = [];
const EMPTY_PRESETS: SizePresetDto[] = [];

export function useCoreItems(profileVersionId: string | null) {
  const t = useTranslations('hr.deliveryNorms');
  const [items, setItems] = useState<CoreItemDto[]>(EMPTY_CORE_ITEMS);
  const [loading, setLoading] = useState(profileVersionId !== null);
  const [error, setError] = useState<string | null>(null);
  const fallback = t('errors.load');

  const load = useCallback(async () => {
    if (profileVersionId === null) {
      setItems(EMPTY_CORE_ITEMS);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
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
  }, [fallback, profileVersionId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, load };
}

export function useSizePresets(profileKey: string | null) {
  const t = useTranslations('hr.deliveryNorms');
  const [presets, setPresets] = useState<SizePresetDto[]>(EMPTY_PRESETS);
  const [loading, setLoading] = useState(profileKey !== null);
  const [error, setError] = useState<string | null>(null);
  const fallback = t('errors.load');

  const load = useCallback(async () => {
    if (profileKey === null) {
      setPresets(EMPTY_PRESETS);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPresets(await deliveryCatalogStructureApi.listSizePresets(profileKey));
      setError(null);
    } catch (caught) {
      if (isAccessRevokedApiError(caught)) {
        setPresets(EMPTY_PRESETS);
      }
      setError(messageFromCaught(caught, fallback));
    } finally {
      setLoading(false);
    }
  }, [fallback, profileKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { presets, setPresets, loading, error, load };
}
