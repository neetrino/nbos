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

/** Soft pastel tones for team member cards (About project sidebar). */
const AVATAR_SOFT_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
] as const;

function hashNameIndex(name: string, paletteSize: number): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % paletteSize;
}

export function employeeFullName(emp: Pick<Employee, 'firstName' | 'lastName'>): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

export function employeeInitials(emp: Pick<Employee, 'firstName' | 'lastName'>): string {
  const first = emp.firstName?.charAt(0)?.toUpperCase() ?? '';
  const last = emp.lastName?.charAt(0)?.toUpperCase() ?? '';
  return first + last || '?';
}

export function employeeAvatarColor(name: string): string {
  return AVATAR_COLORS[hashNameIndex(name, AVATAR_COLORS.length)]!;
}

export function employeeAvatarSoftColor(name: string): string {
  return AVATAR_SOFT_COLORS[hashNameIndex(name, AVATAR_SOFT_COLORS.length)]!;
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
