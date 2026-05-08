import { api } from '../api';

export type ChecklistTemplateCategory =
  | 'DELIVERY'
  | 'MAINTENANCE'
  | 'QA'
  | 'TECHNICAL'
  | 'SOP'
  | 'OTHER';

export type ChecklistOwnerModule = 'MY_COMPANY' | 'PROJECTS' | 'TASKS' | 'TECHNICAL';

export interface ChecklistTemplateItem {
  id: string;
  title: string;
  instruction: string;
  decisionRequired: boolean;
  sortOrder: number;
}

export interface ChecklistTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  category: ChecklistTemplateCategory;
  ownerModule: ChecklistOwnerModule;
  status: string;
  activeVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  activeVersion: { id: string; versionNumber: number; status: string } | null;
}

export interface ChecklistTemplateVersionSummary {
  id: string;
  versionNumber: number;
  status: string;
  createdAt: string;
  createdById?: string;
}

export interface ChecklistTemplateDetail extends ChecklistTemplateListItem {
  activeVersion: { id: string; versionNumber: number; status: string; createdAt: string } | null;
  versions: ChecklistTemplateVersionSummary[];
  draftVersion: {
    id: string;
    versionNumber: number;
    status: string;
    items: unknown;
    createdAt: string;
  } | null;
}

export interface ChecklistTemplateVersionSnapshot {
  id: string;
  versionNumber: number;
  status: string;
  createdAt: string;
  items: unknown;
}

export function parseChecklistTemplateItems(raw: unknown): ChecklistTemplateItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((row, index) => {
      if (!row || typeof row !== 'object') {
        return null;
      }
      const o = row as Record<string, unknown>;
      const title = typeof o.title === 'string' ? o.title : '';
      const instruction = typeof o.instruction === 'string' ? o.instruction : '';
      const id = typeof o.id === 'string' ? o.id : `row-${index}`;
      const decisionRequired = o.decisionRequired === true;
      const sortOrder = typeof o.sortOrder === 'number' ? o.sortOrder : index;
      return { id, title, instruction, decisionRequired, sortOrder };
    })
    .filter((x): x is ChecklistTemplateItem => x !== null);
}

export type DeliveryChecklistTarget = 'PRODUCT' | 'EXTENSION';

export type DeliveryStageCanon = 'STARTING' | 'DEVELOPMENT' | 'QA' | 'TRANSFER';

export interface DeliveryStageChecklistRuleRow {
  id: string;
  target: DeliveryChecklistTarget;
  deliveryStage: DeliveryStageCanon;
  checklistTemplateId: string;
  priority: number;
  filterProductCategory: string | null;
  filterProductType: string | null;
  filterExtensionSize: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  checklistTemplate: {
    id: string;
    name: string;
    status: string;
    activeVersionId: string | null;
  };
}

export interface CreateDeliveryStageChecklistRuleBody {
  target: DeliveryChecklistTarget;
  deliveryStage: DeliveryStageCanon;
  checklistTemplateId: string;
  priority?: number;
  filterProductCategory?: string;
  filterProductType?: string;
  filterExtensionSize?: string;
  isActive?: boolean;
}

export const checklistTemplatesApi = {
  async list(): Promise<ChecklistTemplateListItem[]> {
    const resp = await api.get<ChecklistTemplateListItem[]>('/api/checklist-templates');
    return resp.data;
  },

  async getById(id: string): Promise<ChecklistTemplateDetail> {
    const resp = await api.get<ChecklistTemplateDetail>(`/api/checklist-templates/${id}`);
    return resp.data;
  },

  async create(data: {
    name: string;
    description?: string;
    category: ChecklistTemplateCategory;
    ownerModule: ChecklistOwnerModule;
  }): Promise<ChecklistTemplateDetail> {
    const resp = await api.post<ChecklistTemplateDetail>('/api/checklist-templates', data);
    return resp.data;
  },

  async updateMetadata(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      category: ChecklistTemplateCategory;
      ownerModule: ChecklistOwnerModule;
    }>,
  ): Promise<ChecklistTemplateDetail> {
    const resp = await api.patch<ChecklistTemplateDetail>(`/api/checklist-templates/${id}`, data);
    return resp.data;
  },

  async archive(id: string): Promise<ChecklistTemplateDetail> {
    const resp = await api.post<ChecklistTemplateDetail>(`/api/checklist-templates/${id}/archive`);
    return resp.data;
  },

  async duplicate(id: string): Promise<ChecklistTemplateDetail> {
    const resp = await api.post<ChecklistTemplateDetail>(
      `/api/checklist-templates/${id}/duplicate`,
    );
    return resp.data;
  },

  async getVersionSnapshot(
    templateId: string,
    versionId: string,
  ): Promise<ChecklistTemplateVersionSnapshot> {
    const resp = await api.get<ChecklistTemplateVersionSnapshot>(
      `/api/checklist-templates/${templateId}/versions/${versionId}`,
    );
    return resp.data;
  },

  async updateDraftItems(
    id: string,
    items: ChecklistTemplateItem[],
  ): Promise<ChecklistTemplateDetail> {
    const resp = await api.put<ChecklistTemplateDetail>(
      `/api/checklist-templates/${id}/draft-items`,
      {
        items,
      },
    );
    return resp.data;
  },

  async publish(id: string): Promise<ChecklistTemplateDetail> {
    const resp = await api.post<ChecklistTemplateDetail>(`/api/checklist-templates/${id}/publish`);
    return resp.data;
  },

  async listStageRules(): Promise<DeliveryStageChecklistRuleRow[]> {
    const resp = await api.get<DeliveryStageChecklistRuleRow[]>(
      '/api/checklist-templates/stage-rules',
    );
    return resp.data;
  },

  async createStageRule(
    body: CreateDeliveryStageChecklistRuleBody,
  ): Promise<DeliveryStageChecklistRuleRow> {
    const resp = await api.post<DeliveryStageChecklistRuleRow>(
      '/api/checklist-templates/stage-rules',
      body,
    );
    return resp.data;
  },

  async updateStageRule(
    ruleId: string,
    body: Partial<{
      deliveryStage: DeliveryStageCanon;
      checklistTemplateId: string;
      priority: number;
      isActive: boolean;
    }>,
  ): Promise<DeliveryStageChecklistRuleRow> {
    const resp = await api.patch<DeliveryStageChecklistRuleRow>(
      `/api/checklist-templates/stage-rules/${ruleId}`,
      body,
    );
    return resp.data;
  },

  async deleteStageRule(ruleId: string): Promise<void> {
    await api.delete(`/api/checklist-templates/stage-rules/${ruleId}`);
  },
};
