import { isRawEntityIdLabel } from '@/components/shared/relation-picker/relation-picker-display-label';
import { employeesApi } from '@/lib/api/employees';
import { searchEmployeesForPicker } from '@/lib/employees';

const employeeLabelCache = new Map<string, string>();
const employeeAvatarCache = new Map<string, string>();

export function formatEmployeeDisplayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function rememberEmployeeLabel(id: string, label: string): void {
  if (!id || isRawEntityIdLabel(label, id)) return;
  employeeLabelCache.set(id, label.trim());
}

export function rememberEmployeeLabels(labels: Record<string, string>): void {
  for (const [id, label] of Object.entries(labels)) {
    rememberEmployeeLabel(id, label);
  }
}

export function rememberEmployeeAvatar(id: string, avatar?: string | null): void {
  const trimmed = avatar?.trim();
  if (!id || !trimmed) return;
  employeeAvatarCache.set(id, trimmed);
}

export function rememberEmployeeAvatars(avatars: Record<string, string | null>): void {
  for (const [id, avatar] of Object.entries(avatars)) {
    rememberEmployeeAvatar(id, avatar);
  }
}

export function peekEmployeeLabels(ids: string[]): Record<string, string> {
  return pickEmployeeLabels(ids, Object.fromEntries(employeeLabelCache));
}

export function peekEmployeeAvatars(ids: string[]): Record<string, string | null> {
  return pickEmployeeAvatars(ids, Object.fromEntries(employeeAvatarCache));
}

export function clearEmployeeLabelCache(): void {
  employeeLabelCache.clear();
  employeeAvatarCache.clear();
}

/** Resolves display names for employee ids (sheet participants). */
export async function resolveEmployeeLabelMap(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};

  const resolved: Record<string, string> = {};
  const missing = takeCachedLabels(unique, resolved);
  if (missing.length === 0) return resolved;

  await hydrateFromPickerCache(missing, resolved);
  const stillMissing = missing.filter((id) => !resolved[id]);
  if (stillMissing.length === 0) return resolved;

  await hydrateFromEmployeeApi(stillMissing, resolved);
  return resolved;
}

export function pickEmployeeLabels(
  ids: string[],
  labelMap: Record<string, string>,
): Record<string, string> {
  const entries = ids.flatMap((id) => {
    const label = labelMap[id];
    if (!label || isRawEntityIdLabel(label, id)) return [];
    return [[id, label] as const];
  });
  return Object.fromEntries(entries);
}

export function pickEmployeeAvatars(
  ids: string[],
  avatarMap: Record<string, string | null>,
): Record<string, string | null> {
  const entries = ids.flatMap((id) => {
    const avatar = avatarMap[id]?.trim();
    if (!avatar) return [];
    return [[id, avatar] as const];
  });
  return Object.fromEntries(entries);
}

function takeCachedLabels(ids: string[], into: Record<string, string>): string[] {
  const missing: string[] = [];
  for (const id of ids) {
    const cached = employeeLabelCache.get(id);
    if (cached) {
      into[id] = cached;
      continue;
    }
    missing.push(id);
  }
  return missing;
}

async function hydrateFromPickerCache(ids: string[], into: Record<string, string>): Promise<void> {
  try {
    const options = await searchEmployeesForPicker('');
    for (const option of options) {
      rememberEmployeeLabel(option.value, option.label);
      rememberEmployeeAvatar(option.value, option.avatar);
    }
  } catch {
    return;
  }
  for (const id of ids) {
    const cached = employeeLabelCache.get(id);
    if (cached) into[id] = cached;
  }
}

async function hydrateFromEmployeeApi(ids: string[], into: Record<string, string>): Promise<void> {
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const employee = await employeesApi.getById(id);
        const label = formatEmployeeDisplayName(employee.firstName, employee.lastName);
        rememberEmployeeLabel(id, label);
        rememberEmployeeAvatar(id, employee.avatar);
        return [id, employeeLabelCache.get(id)] as const;
      } catch {
        return [id, undefined] as const;
      }
    }),
  );
  for (const [id, label] of entries) {
    if (label) into[id] = label;
  }
}
