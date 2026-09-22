import { api } from '../api';

const BASE = '/api/delivery-catalog/deals';

export type DealQuoteItemDto = {
  functionId: string;
  tierId: string | null;
  volumeFactor: string;
  volumeReason: string | null;
};

export type DealQuoteDto = {
  dealId: string;
  appliedCollectionId: string | null;
  implementationBase: string;
  designMode: string;
  aiDesignerReview: boolean;
  coreProfileVersionId: string | null;
  coreVolumeFactor: string;
  coreVolumeReason: string | null;
  items: DealQuoteItemDto[];
};

export type DealQuoteWriteBody = {
  appliedCollectionId: string | null;
  coreVolumeFactor?: string;
  coreVolumeReason?: string | null;
  items: DealQuoteItemDto[];
};

export type DealQuotePreviewQuery = {
  productType: string;
  productCategory: string | null;
};

export const deliveryDealQuoteApi = {
  async get(dealId: string, preview?: DealQuotePreviewQuery): Promise<DealQuoteDto> {
    const resp = await api.get<DealQuoteDto>(`${BASE}/${dealId}/quote`, {
      params: previewParams(preview),
    });
    return resp.data;
  },

  async replace(dealId: string, body: DealQuoteWriteBody): Promise<DealQuoteDto> {
    const resp = await api.put<DealQuoteDto>(`${BASE}/${dealId}/quote`, body);
    return resp.data;
  },

  async applyCollection(dealId: string, collectionId: string): Promise<DealQuoteDto> {
    const resp = await api.post<DealQuoteDto>(`${BASE}/${dealId}/quote/apply-collection`, {
      collectionId,
    });
    return resp.data;
  },
};

function previewParams(
  preview: DealQuotePreviewQuery | undefined,
): { productType: string; productCategory?: string } | undefined {
  if (!preview) return undefined;
  return {
    productType: preview.productType,
    ...(preview.productCategory ? { productCategory: preview.productCategory } : {}),
  };
}
