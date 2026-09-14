import { toApiError } from '../api-errors';
import type { Employee } from './employees';

export function readEmployeeFromApiPayload(payload: unknown): Employee | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const inner =
    root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
  if (typeof inner.id !== 'string' || inner.id.length === 0) return null;
  return inner as unknown as Employee;
}

export async function postEmployeeAvatarFile(url: string, file: File): Promise<Employee> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(url, { method: 'POST', body });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw toApiError(payload, 'Could not upload the photo.');
  }
  const employee = readEmployeeFromApiPayload(payload);
  if (!employee) {
    throw toApiError(payload, 'Could not upload the photo.');
  }
  return employee;
}
