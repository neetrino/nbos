import { api } from '../api';

const BASE = '/api/delivery-catalog/deals';

export type DealQuoteItemDto = {
  functionId: string;
  tierId: string | null;
};

export type DealQuoteDto = {
  dealId: string;
  appliedCollectionId: string | null;
  implementationBase: string;
  designMode: string;
  aiDesignerReview: boolean;
  coreProfileVersionId: string | null;
  items: DealQuoteItemDto[];
};

export type DealQuoteWriteBody = {
  implementationBase: string;
  designMode: string;
  aiDesignerReview: boolean;
  appliedCollectionId: string | null;
  items: DealQuoteItemDto[];
};

export const deliveryDealQuoteApi = {
  async get(dealId: string): Promise<DealQuoteDto> {
    const resp = await api.get<DealQuoteDto>(`${BASE}/${dealId}/quote`);
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
