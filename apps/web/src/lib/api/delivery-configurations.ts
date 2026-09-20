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
  baseProfileVersionId: string | null;
  draftVersion: number;
  /** Send back as `expectedRevision` on a scope change; the server refuses changes without it. */
  expectedRevision: number;
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
    options: { reason?: string; expectedRevision?: number; tierId?: string } = {},
  ): Promise<OperationalConfigurationDto> {
    const resp = await api.post<OperationalConfigurationDto>(
      `/api/delivery-configurations/${configurationId}/features`,
      {
        functionId,
        reason: options.reason,
        expectedRevision: options.expectedRevision,
        tierId: options.tierId,
      },
    );
    return resp.data;
  },

  async getReplacementPlan(configurationId: string, roleKey: string): Promise<ReplacementPlanDto> {
    const resp = await api.get<ReplacementPlanDto>(
      `/api/delivery-configurations/${configurationId}/replacement-plan`,
      { params: { roleKey } },
    );
    return resp.data;
  },

  async replaceEmployee(
    configurationId: string,
    body: ReplaceEmployeeBody,
  ): Promise<OperationalConfigurationDto> {
    const resp = await api.post<OperationalConfigurationDto>(
      `/api/delivery-configurations/${configurationId}/replacements`,
      body,
    );
    return resp.data;
  },
};

export type ReplacementPlanHolderDto = {
  allocationId: string;
  employeeId: string;
  employeeName: string;
  hasReleases: boolean;
};

export type ReplacementPlanComponentDto = {
  componentId: string;
  componentKey: string;
  kind: string;
  holders: ReplacementPlanHolderDto[];
};

export type ReplacementPlanDto = {
  configurationId: string;
  roleKey: string;
  expectedRevision: number | null;
  components: ReplacementPlanComponentDto[];
};

export type ReplaceEmployeeShareInput = {
  componentId: string;
  outgoingPercent: string;
  incomingPercent: string;
};

export type ReplaceEmployeeBody = {
  roleKey: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  shares: ReplaceEmployeeShareInput[];
  reason: string;
  expectedRevision?: number;
};
