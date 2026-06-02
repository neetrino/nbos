import type { Employee } from '@/lib/api/employees';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
] as const;

export function employeeFullName(emp: Pick<Employee, 'firstName' | 'lastName'>): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

export function employeeInitials(emp: Pick<Employee, 'firstName' | 'lastName'>): string {
  const first = emp.firstName?.charAt(0)?.toUpperCase() ?? '';
  const last = emp.lastName?.charAt(0)?.toUpperCase() ?? '';
  return first + last || '?';
}

export function employeeAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index]!;
}

export function employeePrimaryDepartment(emp: Employee): string | null {
  const primary = emp.departments?.find((d) => d.isPrimary);
  return primary?.department?.name ?? emp.departments?.[0]?.department?.name ?? null;
}

export function employeeTenure(hireDate: string | null): string {
  if (!hireDate) return '—';
  const diff = Date.now() - new Date(hireDate).getTime();
  const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
  if (months < 1) return 'New';
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
}
