import { api } from '../api';

export type OperationalConfigurationDto = {
  id: string;
  productId: string | null;
  extensionId: string | null;
  mode: string;
  enrolled: boolean;
  designMode: string | null;
  aiDesignerReview: boolean;
  configSize: string | null;
  implementationBase: string | null;
  checkedAt: string | null;
  draftVersion: number;
  readiness?: { planState: string; errors: string[] };
  features: Array<{
    id: string;
    functionId: string;
    origin: string;
    localNote: string | null;
    workState: string;
  }>;
};

export const deliveryConfigurationsApi = {
  async getByProduct(productId: string): Promise<OperationalConfigurationDto | { mode: 'LEGACY' }> {
    const resp = await api.get<OperationalConfigurationDto | { mode: 'LEGACY' }>(
      `/api/delivery-configurations/by-product/${productId}`,
    );
    return resp.data;
  },

  async addFeature(
    configurationId: string,
    functionId: string,
    reason?: string,
  ): Promise<OperationalConfigurationDto> {
    const resp = await api.post<OperationalConfigurationDto>(
      `/api/delivery-configurations/${configurationId}/features`,
      { functionId, reason },
    );
    return resp.data;
  },
};
