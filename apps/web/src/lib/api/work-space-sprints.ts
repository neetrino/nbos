import { api } from '../api';

export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'CLOSED';

export interface WorkSpaceSprint {
  id: string;
  workspaceId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  closedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: { tasks: number };
}

export type UnfinishedSprintTaskAction = 'BACKLOG' | 'NEXT_SPRINT' | 'KEEP';

export const workSpaceSprintsApi = {
  async list(workspaceId: string): Promise<WorkSpaceSprint[]> {
    const resp = await api.get<WorkSpaceSprint[]>(`/api/tasks/work-spaces/${workspaceId}/sprints`);
    return resp.data;
  },
  async create(
    workspaceId: string,
    data: { name: string; goal?: string; startDate?: string; endDate?: string },
  ): Promise<WorkSpaceSprint> {
    const resp = await api.post<WorkSpaceSprint>(
      `/api/tasks/work-spaces/${workspaceId}/sprints`,
      data,
    );
    return resp.data;
  },
  async update(
    workspaceId: string,
    sprintId: string,
    data: {
      name?: string;
      goal?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    },
  ): Promise<WorkSpaceSprint> {
    const resp = await api.patch<WorkSpaceSprint>(
      `/api/tasks/work-spaces/${workspaceId}/sprints/${sprintId}`,
      data,
    );
    return resp.data;
  },
  async start(workspaceId: string, sprintId: string): Promise<WorkSpaceSprint> {
    const resp = await api.post<WorkSpaceSprint>(
      `/api/tasks/work-spaces/${workspaceId}/sprints/${sprintId}/start`,
    );
    return resp.data;
  },
  async close(
    workspaceId: string,
    sprintId: string,
    data: { unfinishedTaskAction: UnfinishedSprintTaskAction; nextSprintId?: string },
  ): Promise<WorkSpaceSprint> {
    const resp = await api.post<WorkSpaceSprint>(
      `/api/tasks/work-spaces/${workspaceId}/sprints/${sprintId}/close`,
      data,
    );
    return resp.data;
  },
  async moveTask(
    workspaceId: string,
    taskId: string,
    sprintId: string | null,
  ): Promise<{ id: string }> {
    const resp = await api.post<{ id: string }>(
      `/api/tasks/work-spaces/${workspaceId}/sprints/move-task/${taskId}`,
      { sprintId },
    );
    return resp.data;
  },
};
