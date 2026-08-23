import { api } from '../api';

export interface AiAdminActivityPage {
  items: unknown[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export async function adminGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return (await api.get<T>(url, { params })).data;
}

export async function adminPost<T>(url: string, body?: unknown): Promise<T> {
  return (await api.post<T>(url, body ?? {})).data;
}

export async function adminPatch<T>(url: string, body: unknown): Promise<T> {
  return (await api.patch<T>(url, body)).data;
}

export async function adminDelete(url: string): Promise<void> {
  await api.delete(url);
}

export function validateReplacementProvider(id: string, apiKey: string) {
  return adminPost<{ ok: boolean; errorCode?: string | null }>(
    `/api/ai-admin/providers/${id}/validate-replacement`,
    { apiKey },
  );
}
