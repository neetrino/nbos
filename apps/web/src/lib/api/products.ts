import { api } from '../api';
import type { ChecklistStageProgress, DeliveryLifecycleProjection } from './projects';

export interface ProductEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ProductClosedByRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Product {
  id: string;
  projectId: string;
  name: string;
  productCategory: string;
  productType: string;
  status: string;
  deliveryLifecycle?: DeliveryLifecycleProjection;
  pmId: string | null;
  developerId?: string | null;
  designerId?: string | null;
  technicalSpecialistId?: string | null;
  qaLeadId?: string | null;
  deadline: string | null;
  description: string | null;
  checklistTemplateId: string | null;
  /** ISO-like language codes (e.g. hy, en, ru). */
  languages?: string[];
  clientAcceptedAt: string | null;
  clientAcceptedBy: string | null;
  clientAcceptanceNote: string | null;
  closedAt?: string | null;
  closedBy?: ProductClosedByRef | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    code: string;
    companyId?: string | null;
    company?: { id: string; name: string } | null;
    contactId?: string | null;
    contact?: { id: string; firstName: string; lastName: string } | null;
  };
  pm: ProductEmployee | null;
  order?: {
    id: string;
    code?: string;
    status?: string;
    invoices?: Array<{ moneyStatus: string }>;
  } | null;
  _count: { extensions: number; tasks: number; tickets: number };
  checklistStageProgress?: ChecklistStageProgress | null;
  /** Product delivery Work Space id when provisioned; null if not yet created. */
  workSpaceId?: string | null;
}

export interface ProductTechnicalProfileRef {
  productionUrl: string | null;
  stagingUrl: string | null;
  repositoryUrl: string | null;
  hostingProvider: string | null;
  technicalOwnerId: string | null;
}

export interface FullProduct extends Product {
  extensions: ProductExtensionRef[];
  tasks: ProductTaskRef[];
  tickets: ProductTicketRef[];
  order: ProductOrderRef | null;
  doneReadiness?: ProductDoneReadiness;
  technicalProfiles?: ProductTechnicalProfileRef[];
  developer?: ProductEmployee | null;
  designer?: ProductEmployee | null;
  technicalSpecialist?: ProductEmployee | null;
  qaLead?: ProductEmployee | null;
}

export interface ProductDoneReadiness {
  canCompleteWithRuntimeData: boolean;
  blockers: ProductDoneReadinessItem[];
  warnings: ProductDoneReadinessItem[];
  missingRuntimeSignals: ProductDoneReadinessItem[];
  summary: {
    approvedOfferFilePresent: boolean;
    clientAccepted: boolean;
    contractFilePresent: boolean;
    credentialCount: number;
    deliveryFileRuntimeAvailable: boolean;
    domainCount: number;
    expiringDomainCount: number;
    expiredDomainCount: number;
    handoffCredentialCount: number;
    openExtensionCount: number;
    openTaskCount: number;
    openTicketCount: number;
    unpaidInvoiceCount: number;
  };
}

export interface ProductDoneReadinessItem {
  code: string;
  label: string;
  message: string;
}

export interface ProductExtensionRef {
  id: string;
  name: string;
  size: string;
  status: string;
  assignedTo: string | null;
  assignee: ProductEmployee | null;
  createdAt: string;
  order?: {
    id: string;
    deal?: { id: string; code?: string; name?: string | null } | null;
  } | null;
}

export interface ProductTaskRef {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  assignee: ProductEmployee | null;
  dueDate: string | null;
}

export interface ProductTicketRef {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
}

export interface ProductOrderRef {
  id: string;
  code: string;
  type: string;
  paymentType: string;
  totalAmount: string;
  currency: string;
  status: string;
  deal?: {
    id: string;
    name: string | null;
    code: string;
    offerFileUrl?: string | null;
    contractFileUrl?: string | null;
    seller?: ProductEmployee | null;
  } | null;
  invoices?: Array<{ moneyStatus: string }>;
}

export interface ProductStats {
  total: number;
  byStatus: Array<{ status: string; _count: number }>;
  byType: Array<{ productType: string; _count: number }>;
}

interface ListData {
  items: Product[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface CreateProductData {
  projectId: string;
  name: string;
  productCategory: string;
  productType: string;
  pmId?: string;
  deadline?: string;
  description?: string;
  checklistTemplateId?: string;
  languages?: string[];
}

export interface UpdateProductData {
  name?: string;
  productCategory?: string;
  productType?: string;
  pmId?: string | null;
  developerId?: string | null;
  designerId?: string | null;
  technicalSpecialistId?: string | null;
  qaLeadId?: string | null;
  deadline?: string | null;
  description?: string | null;
  checklistTemplateId?: string | null;
  languages?: string[];
}

export interface PauseDeliveryData {
  reason: string;
  onHoldUntil: string;
}

export interface CancelDeliveryData {
  reason: string;
}

export interface MoveDeliveryStageData {
  stage: 'STARTING' | 'DEVELOPMENT' | 'QA' | 'TRANSFER';
}

export interface ConfirmAcceptanceData {
  acceptedBy?: string;
  note?: string;
}

export interface ProductAccessSlotBoundCredential {
  id: string;
  name: string;
  category: string;
  credentialType: string;
  login: string | null;
  url: string | null;
}

export interface ProductAccessSlotBindingItem {
  bindingId: string;
  boundCredential: ProductAccessSlotBoundCredential | null;
}

export interface ProductAccessSlotRow {
  slotKey: string;
  label: string;
  required: boolean;
  kind: 'credential';
  allowedCategories: string[];
  defaultCredentialType: string | null;
  bindings: ProductAccessSlotBindingItem[];
}

export interface ProductAccessSlotsResponse {
  productId: string;
  slots: ProductAccessSlotRow[];
}

export interface ProductAccessSlotBindMeta {
  requestedSlotKey: string;
  effectiveSlotKey: string;
  effectiveSlotLabel: string;
}

export type ProductAccessSlotsBindResponse = ProductAccessSlotsResponse & {
  bindMeta?: ProductAccessSlotBindMeta;
};

export const productsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData> {
    const resp = await api.get<ListData>('/api/projects/products', { params });
    return resp.data;
  },

  async getById(id: string): Promise<FullProduct> {
    const resp = await api.get<FullProduct>(`/api/projects/products/${id}`);
    return resp.data;
  },

  async create(data: CreateProductData): Promise<Product> {
    const resp = await api.post<Product>('/api/projects/products', data);
    return resp.data;
  },

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const resp = await api.put<Product>(`/api/projects/products/${id}`, data);
    return resp.data;
  },

  async updateStatus(id: string, status: string): Promise<Product> {
    const resp = await api.patch<Product>(`/api/projects/products/${id}/status`, { status });
    return resp.data;
  },

  async moveStage(id: string, data: MoveDeliveryStageData): Promise<Product> {
    const resp = await api.patch<Product>(`/api/projects/products/${id}/stage`, data);
    return resp.data;
  },

  async pause(id: string, data: PauseDeliveryData): Promise<Product> {
    const resp = await api.patch<Product>(`/api/projects/products/${id}/pause`, data);
    return resp.data;
  },

  async resume(id: string): Promise<Product> {
    const resp = await api.patch<Product>(`/api/projects/products/${id}/resume`);
    return resp.data;
  },

  async cancel(id: string, data: CancelDeliveryData): Promise<Product> {
    const resp = await api.patch<Product>(`/api/projects/products/${id}/cancel`, data);
    return resp.data;
  },

  async complete(id: string): Promise<Product> {
    const resp = await api.patch<Product>(`/api/projects/products/${id}/complete`);
    return resp.data;
  },

  async confirmAcceptance(id: string, data: ConfirmAcceptanceData): Promise<Product> {
    const resp = await api.patch<Product>(`/api/projects/products/${id}/acceptance`, data);
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/projects/products/${id}`);
  },

  async getStats(projectId?: string): Promise<ProductStats> {
    const resp = await api.get<ProductStats>('/api/projects/products/stats', {
      params: projectId ? { projectId } : undefined,
    });
    return resp.data;
  },

  async getAccessSlots(productId: string): Promise<ProductAccessSlotsResponse> {
    const resp = await api.get<ProductAccessSlotsResponse>(
      `/api/projects/products/${productId}/access-slots`,
    );
    return resp.data;
  },

  async bindAccessSlot(
    productId: string,
    body: { slotKey: string; credentialId: string },
  ): Promise<ProductAccessSlotsBindResponse> {
    const resp = await api.put<ProductAccessSlotsBindResponse>(
      `/api/projects/products/${productId}/access-slots`,
      body,
    );
    return resp.data;
  },

  async unbindAccessSlotBinding(
    productId: string,
    bindingId: string,
  ): Promise<ProductAccessSlotsResponse> {
    const resp = await api.delete<ProductAccessSlotsResponse>(
      `/api/projects/products/${productId}/access-slots/bindings/${encodeURIComponent(bindingId)}`,
    );
    return resp.data;
  },
};
