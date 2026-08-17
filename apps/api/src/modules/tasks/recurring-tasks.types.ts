export interface CreateRecurringTemplateDto {
  title: string;
  creatorId: string;
  description?: string;
  assigneeId?: string;
  priority?: string;
  frequency: string;
  interval?: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  dueDateOffset?: number;
  checklistData?: unknown;
  linksData?: unknown;
}

export interface UpdateRecurringTemplateDto {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  priority?: string;
  frequency?: string;
  interval?: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string | null;
  dueDateOffset?: number | null;
  isActive?: boolean;
  checklistData?: unknown;
  linksData?: unknown;
}

export interface RecurringDueRunResult {
  created: number;
  failed: number;
  taskIds: string[];
}
