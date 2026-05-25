import type { BonusType } from '@/lib/api/bonus';

export const BONUS_BOARD_TYPE_CONFIG: Record<BonusType, { label: string; color: string }> = {
  SALES: { label: 'Sales', color: 'bg-blue-500/10 text-blue-600' },
  DELIVERY: { label: 'Delivery', color: 'bg-cyan-500/10 text-cyan-700' },
  PM: { label: 'PM', color: 'bg-purple-500/10 text-purple-600' },
  DESIGN: { label: 'Design', color: 'bg-pink-500/10 text-pink-600' },
  MARKETING: { label: 'Marketing', color: 'bg-amber-500/10 text-amber-700' },
};
