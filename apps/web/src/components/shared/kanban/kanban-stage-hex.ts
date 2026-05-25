/** Maps Tailwind `bg-*` stage tokens to hex for full-width kanban headers. */
export const KANBAN_TAILWIND_BG_HEX: Record<string, string> = {
  'bg-blue-400': '#60A5FA',
  'bg-blue-500': '#3B82F6',
  'bg-amber-500': '#F59E0B',
  'bg-gray-400': '#9CA3AF',
  'bg-indigo-500': '#6366F1',
  'bg-purple-500': '#A855F7',
  'bg-violet-500': '#8B5CF6',
  'bg-fuchsia-500': '#D946EF',
  'bg-red-400': '#F87171',
  'bg-red-500': '#EF4444',
  'bg-red-600': '#DC2626',
  'bg-emerald-500': '#10B981',
  'bg-green-500': '#22C55E',
  'bg-green-600': '#16A34A',
  'bg-orange-500': '#F97316',
  'bg-slate-500': '#64748B',
};

export function resolveKanbanStageHex(colorClass: string, hexColor?: string): string | undefined {
  if (hexColor) return hexColor;
  if (colorClass.startsWith('#')) return colorClass;
  return KANBAN_TAILWIND_BG_HEX[colorClass];
}
