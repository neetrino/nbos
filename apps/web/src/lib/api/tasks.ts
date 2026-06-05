import { api } from '../api';

export interface TaskLink {
  id: string;
  taskId: string;
  entityType: string;
  entityId: string;
  /** Resolved title from API (project name, product name, order code, …). */
  entityLabel?: string | null;
  createdAt: string;
}

export interface TaskChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  checked: boolean;
  sortOrder: number;
}

export interface TaskChecklist {
  id: string;
  taskId: string;
  title: string;
  createdAt: string;
  items: TaskChecklistItem[];
}

export interface TaskOrderRef {
  id: string;
  code: string;
}

export interface TaskSprintRef {
  id: string;
  name: string;
  status: 'PLANNING' | 'ACTIVE' | 'CLOSED';
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  closedAt?: string | null;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  sprintId?: string | null;
  sprint?: TaskSprintRef | null;
  dueDate: string | null;
  completedAt: string | null;
  reviewRequestedAt: string | null;
  reviewApprovedAt: string | null;
  completionRules: TaskCompletionRule[] | null;
  parentId: string | null;
  workspaceId: string | null;
  planningStatus: string;
  myPlanStageId: string | null;
  myPlanSortOrder: number;
  workspaceSortOrder: number;
  chatId: string | null;
  isRecurring: boolean;
  coAssignees: string[];
  observers: string[];
  createdAt: string;
  updatedAt: string;
  creator: { id: string; firstName: string; lastName: string };
  assignee: { id: string; firstName: string; lastName: string } | null;
  reviewer?: { id: string; firstName: string; lastName: string } | null;
  parent?: { id: string; code: string; title: string } | null;
  links: TaskLink[];
  checklists: TaskChecklist[];
  subtasks: Array<{
    id: string;
    code: string;
    title: string;
    status: string;
    assigneeId: string | null;
  }>;
  _count: { subtasks: number; checklists: number };
  /** Present when API returns task detail / project-scoped list (Order context). */
  product?: { id: string; name: string; order: TaskOrderRef | null } | null;
  extension?: {
    id: string;
    name: string;
    order: TaskOrderRef | null;
    product: { id: string; name: string };
  } | null;
  workspace?: {
    id: string;
    name: string;
    product?: { id: string; name: string; order: TaskOrderRef | null } | null;
    extension?: {
      id: string;
      name: string;
      order: TaskOrderRef | null;
      product: { id: string; name: string };
    } | null;
  } | null;
}

export type TaskCompletionRuleType =
  | 'requires_checklist_complete'
  | 'requires_subtasks_complete'
  | 'requires_review'
  | 'requires_attachment'
  | 'requires_creator_approval'
  | 'requires_specific_field'
  | 'requires_linked_entity_condition';

export interface TaskCompletionRule {
  type: TaskCompletionRuleType;
  enabled?: boolean;
  label?: string;
}

export interface TaskBoardStage {
  id: string;
  ownerId: string | null;
  boardType: string;
  title: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
}

export interface WorkSpace {
  id: string;
  projectId: string | null;
  productId: string | null;
  extensionId: string | null;
  name: string;
  type: 'PRODUCT_DELIVERY' | 'EXTENSION_DELIVERY' | 'STANDALONE_OPERATIONAL';
  scrumEnabled: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; code: string; name: string } | null;
  product?: {
    id: string;
    name: string;
    status: string;
    order?: { deal?: { id: string } | null } | null;
  } | null;
  extension?: { id: string; name: string; status: string } | null;
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface WorkSpaceQueryParams {
  projectId?: string;
  productId?: string;
  extensionId?: string;
  type?: WorkSpace['type'];
  page?: number;
  pageSize?: number;
  search?: string;
  mode?: 'all' | 'scrum' | 'kanban';
}

export interface WorkSpaceListPayload {
  items: WorkSpace[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
  counts: { standalone: number; product: number; total: number };
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

interface TaskQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  assigneeId?: string;
  creatorId?: string;
  workspaceId?: string;
  planningStatus?: string;
  entityType?: string;
  entityId?: string;
  projectId?: string;
  orderId?: string;
  parentId?: string;
  hasParent?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** Only tasks where this employee is assignee, creator, co-assignee, or observer. */
  involvesEmployeeId?: string;
}

/** Workspace aggregates from `GET /api/tasks/stats` (Prisma `groupBy`). */
export interface TaskStats {
  byStatus: Array<{ status: string; _count: number }>;
  byPriority: Array<{ priority: string; _count: number }>;
}

export const tasksApi = {
  async getAll(params?: TaskQueryParams): Promise<ListData<Task>> {
    const resp = await api.get<ListData<Task>>('/api/tasks', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Task> {
    const resp = await api.get<Task>(`/api/tasks/${id}`);
    return resp.data;
  },
  async getByEntity(entityType: string, entityId: string): Promise<Task[]> {
    const resp = await api.get<Task[]>(`/api/tasks/by-entity/${entityType}/${entityId}`);
    return resp.data;
  },
  async create(data: {
    title: string;
    creatorId: string;
    description?: string;
    assigneeId?: string;
    coAssignees?: string[];
    observers?: string[];
    priority?: string;
    workspaceId?: string;
    sprintId?: string | null;
    planningStatus?: string;
    completionRules?: TaskCompletionRule[];
    dueDate?: string;
    parentId?: string;
    links?: Array<{ entityType: string; entityId: string }>;
  }): Promise<Task> {
    const resp = await api.post<Task>('/api/tasks', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Task> {
    const resp = await api.put<Task>(`/api/tasks/${id}`, data);
    return resp.data;
  },
  async start(id: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/start`);
    return resp.data;
  },
  async complete(id: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/complete`);
    return resp.data;
  },
  async reopen(id: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/reopen`);
    return resp.data;
  },
  async setOnHold(id: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/on-hold`);
    return resp.data;
  },
  async submitForReview(id: string, reviewerId?: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/submit-review`, { reviewerId });
    return resp.data;
  },
  async approveReview(id: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/approve-review`);
    return resp.data;
  },
  async requestReviewChanges(id: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/request-review-changes`);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
  },
  async reorder(taskIds: string[], scope: 'workspace' | 'my-plan'): Promise<{ success: true }> {
    const resp = await api.patch<{ success: true }>('/api/tasks/reorder', { taskIds, scope });
    return resp.data;
  },
  async getStats(params?: { involvesEmployeeId?: string }): Promise<TaskStats> {
    const resp = await api.get<TaskStats>('/api/tasks/stats', { params });
    return resp.data;
  },

  // Work Spaces
  async getWorkSpaces(params?: WorkSpaceQueryParams): Promise<WorkSpaceListPayload> {
    const resp = await api.get<WorkSpaceListPayload>('/api/tasks/work-spaces', { params });
    return resp.data;
  },
  async getWorkSpaceById(id: string): Promise<WorkSpace> {
    const resp = await api.get<WorkSpace>(`/api/tasks/work-spaces/${id}`);
    return resp.data;
  },
  async getWorkSpaceByProductId(productId: string): Promise<WorkSpace> {
    const resp = await api.get<WorkSpace>(`/api/tasks/work-spaces/by-product/${productId}`);
    return resp.data;
  },
  async createWorkSpace(data: {
    name: string;
    type: Exclude<WorkSpace['type'], 'EXTENSION_DELIVERY'>;
    projectId?: string;
    productId?: string;
    extensionId?: string;
    scrumEnabled?: boolean;
    description?: string;
  }): Promise<WorkSpace> {
    const resp = await api.post<WorkSpace>('/api/tasks/work-spaces', data);
    return resp.data;
  },
  async ensureProductWorkSpace(productId: string): Promise<WorkSpace> {
    const resp = await api.post<WorkSpace>(`/api/tasks/work-spaces/product/${productId}/ensure`);
    return resp.data;
  },
  async ensureExtensionWorkSpace(extensionId: string): Promise<WorkSpace> {
    // Extension work uses the parent Product Work Space; this endpoint returns that space.
    const resp = await api.post<WorkSpace>(
      `/api/tasks/work-spaces/extension/${extensionId}/ensure`,
    );
    return resp.data;
  },
  async updateWorkSpace(id: string, data: Record<string, unknown>): Promise<WorkSpace> {
    const resp = await api.patch<WorkSpace>(`/api/tasks/work-spaces/${id}`, data);
    return resp.data;
  },

  // Links
  async addLink(taskId: string, entityType: string, entityId: string): Promise<TaskLink> {
    const resp = await api.post<TaskLink>(`/api/tasks/${taskId}/links`, { entityType, entityId });
    return resp.data;
  },
  async removeLink(taskId: string, linkId: string): Promise<void> {
    await api.delete(`/api/tasks/${taskId}/links/${linkId}`);
  },

  // Checklists
  async createChecklist(taskId: string, title?: string): Promise<TaskChecklist> {
    const resp = await api.post<TaskChecklist>(`/api/tasks/${taskId}/checklists`, { title });
    return resp.data;
  },
  async addChecklistItem(checklistId: string, text: string): Promise<TaskChecklistItem> {
    const resp = await api.post<TaskChecklistItem>(`/api/tasks/checklists/${checklistId}/items`, {
      text,
    });
    return resp.data;
  },
  async toggleChecklistItem(itemId: string): Promise<TaskChecklistItem> {
    const resp = await api.patch<TaskChecklistItem>(`/api/tasks/checklist-items/${itemId}/toggle`);
    return resp.data;
  },
  async deleteChecklistItem(itemId: string): Promise<void> {
    await api.delete(`/api/tasks/checklist-items/${itemId}`);
  },
  async deleteChecklist(checklistId: string): Promise<void> {
    await api.delete(`/api/tasks/checklists/${checklistId}`);
  },

  // Board stages (MY_PLAN; global KANBAN columns are status-driven in the app)
  async getMyPlanStages(ownerId: string): Promise<TaskBoardStage[]> {
    const resp = await api.get<TaskBoardStage[]>('/api/task-boards/my-plan/stages', {
      params: { ownerId },
    });
    return resp.data;
  },
  async createStage(data: {
    title: string;
    color?: string;
    ownerId: string;
  }): Promise<TaskBoardStage> {
    const resp = await api.post<TaskBoardStage>('/api/task-boards/stages', data);
    return resp.data;
  },
  async updateStage(id: string, data: Record<string, unknown>): Promise<TaskBoardStage> {
    const resp = await api.patch<TaskBoardStage>(`/api/task-boards/stages/${id}`, data);
    return resp.data;
  },
  async deleteStage(id: string): Promise<void> {
    await api.delete(`/api/task-boards/stages/${id}`);
  },
  async reorderStages(stageIds: string[]): Promise<void> {
    await api.patch('/api/task-boards/stages/reorder', { stageIds });
  },
};
