import { api } from '../api';

export interface TaskLink {
  id: string;
  taskId: string;
  entityType: string;
  entityId: string;
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

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  parentId: string | null;
  kanbanStageId: string | null;
  myPlanStageId: string | null;
  myPlanSortOrder: number;
  chatId: string | null;
  isRecurring: boolean;
  coAssignees: string[];
  observers: string[];
  createdAt: string;
  updatedAt: string;
  creator: { id: string; firstName: string; lastName: string };
  assignee: { id: string; firstName: string; lastName: string } | null;
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
  entityType?: string;
  entityId?: string;
  parentId?: string;
  hasParent?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
    startDate?: string;
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
  async defer(id: string): Promise<Task> {
    const resp = await api.patch<Task>(`/api/tasks/${id}/defer`);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
  },
  async getStats() {
    const resp = await api.get('/api/tasks/stats');
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

  // Board stages
  async getKanbanStages(): Promise<TaskBoardStage[]> {
    const resp = await api.get<TaskBoardStage[]>('/api/task-boards/kanban/stages');
    return resp.data;
  },
  async getMyPlanStages(ownerId: string): Promise<TaskBoardStage[]> {
    const resp = await api.get<TaskBoardStage[]>('/api/task-boards/my-plan/stages', {
      params: { ownerId },
    });
    return resp.data;
  },
  async createStage(data: {
    boardType: 'KANBAN' | 'MY_PLAN';
    title: string;
    color?: string;
    ownerId?: string;
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
