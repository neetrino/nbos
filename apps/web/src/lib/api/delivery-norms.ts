import type {
  DeliveryBaseProfileFinancialDto,
  DeliveryCompensationRoleKey,
  DeliveryFunctionPriceFinancialDto,
  DeliveryRoleRateFinancialDto,
  DeliveryRoleUnitInput,
} from '@nbos/shared';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
import { api } from '../api';

const RULES_BASE = '/api/delivery-compensation/rules';

export type CreateRoleRateBody = {
  roleKey: DeliveryCompensationRoleKey;
  rate: string;
  effectiveFrom: string;
  currency?: string;
};

export type CreateFunctionPriceBody = {
  functionId: string;
  tierId?: string | null;
  effectiveFrom: string;
  roleUnits: DeliveryRoleUnitInput[];
};

export type CreateBaseProfileBody = {
  profileKey: string;
  entityKind: 'PRODUCT' | 'EXTENSION';
  productType: string | null;
  productCategory: string | null;
  description?: string | null;
  effectiveFrom: string;
  roleUnits: DeliveryRoleUnitInput[];
  includedFunctionIds?: string[];
};

export type PublishVectorBody = {
  confirmZeroUnits?: boolean;
};

export type DeliveryEnrollmentSetting = {
  newEnrollmentEnabled: boolean;
  updatedAt: string | null;
};

export const deliveryNormsApi = {
  async getEnrollment(): Promise<DeliveryEnrollmentSetting> {
    const resp = await api.get<DeliveryEnrollmentSetting>(`${RULES_BASE}/enrollment`);
    return resp.data;
  },

  async setEnrollment(enabled: boolean): Promise<DeliveryEnrollmentSetting> {
    const resp = await api.post<DeliveryEnrollmentSetting>(`${RULES_BASE}/enrollment`, { enabled });
    return resp.data;
  },

  async listRoleRates(): Promise<DeliveryRoleRateFinancialDto[]> {
    const resp = await api.get<DeliveryRoleRateFinancialDto[]>(`${RULES_BASE}/role-rates`);
    return resp.data;
  },

  async listBaseProfiles(): Promise<DeliveryBaseProfileFinancialDto[]> {
    const resp = await api.get<DeliveryBaseProfileFinancialDto[]>(`${RULES_BASE}/base-profiles`);
    return resp.data;
  },

  async listFunctionPrices(): Promise<DeliveryFunctionPriceFinancialDto[]> {
    const resp = await api.get<DeliveryFunctionPriceFinancialDto[]>(
      `${RULES_BASE}/function-prices`,
    );
    return resp.data;
  },

  async createRoleRate(body: CreateRoleRateBody): Promise<DeliveryRoleRateFinancialDto> {
    const resp = await api.post<DeliveryRoleRateFinancialDto>(`${RULES_BASE}/role-rates`, {
      ...body,
      currency: body.currency ?? DELIVERY_COMPENSATION_CURRENCY,
    });
    return resp.data;
  },

  async createBaseProfile(body: CreateBaseProfileBody): Promise<DeliveryBaseProfileFinancialDto> {
    const resp = await api.post<DeliveryBaseProfileFinancialDto>(
      `${RULES_BASE}/base-profiles`,
      body,
    );
    return resp.data;
  },

  async createFunctionPrice(
    body: CreateFunctionPriceBody,
  ): Promise<DeliveryFunctionPriceFinancialDto> {
    const resp = await api.post<DeliveryFunctionPriceFinancialDto>(
      `${RULES_BASE}/function-prices`,
      body,
    );
    return resp.data;
  },

  async updateRoleRateDraft(
    id: string,
    body: { rate: string },
  ): Promise<DeliveryRoleRateFinancialDto> {
    const resp = await api.patch<DeliveryRoleRateFinancialDto>(
      `${RULES_BASE}/role-rates/${id}`,
      body,
    );
    return resp.data;
  },

  async updateFunctionPriceDraft(
    id: string,
    body: { roleUnits: DeliveryRoleUnitInput[] },
  ): Promise<DeliveryFunctionPriceFinancialDto> {
    const resp = await api.patch<DeliveryFunctionPriceFinancialDto>(
      `${RULES_BASE}/function-prices/${id}`,
      body,
    );
    return resp.data;
  },

  async publishRoleRate(id: string): Promise<DeliveryRoleRateFinancialDto> {
    const resp = await api.post<DeliveryRoleRateFinancialDto>(
      `${RULES_BASE}/role-rates/${id}/publish`,
    );
    return resp.data;
  },

  async publishBaseProfile(
    id: string,
    body?: PublishVectorBody,
  ): Promise<DeliveryBaseProfileFinancialDto> {
    const resp = await api.post<DeliveryBaseProfileFinancialDto>(
      `${RULES_BASE}/base-profiles/${id}/publish`,
      body ?? {},
    );
    return resp.data;
  },

  async publishFunctionPrice(
    id: string,
    body?: PublishVectorBody,
  ): Promise<DeliveryFunctionPriceFinancialDto> {
    const resp = await api.post<DeliveryFunctionPriceFinancialDto>(
      `${RULES_BASE}/function-prices/${id}/publish`,
      body ?? {},
    );
    return resp.data;
  },
};
