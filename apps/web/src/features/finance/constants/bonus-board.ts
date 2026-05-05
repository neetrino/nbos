import type { BonusStatus, BonusType } from '@/lib/api/bonus';

export const BONUS_BOARD_STATUSES: readonly { key: BonusStatus; label: string; color: string }[] = [
  { key: 'INCOMING', label: 'Incoming', color: 'bg-gray-400' },
  { key: 'EARNED', label: 'Earned', color: 'bg-blue-400' },
  { key: 'PENDING_ELIGIBILITY', label: 'Pending Eligibility', color: 'bg-amber-400' },
  { key: 'VESTED', label: 'Vested', color: 'bg-indigo-500' },
  { key: 'ACTIVE', label: 'Active', color: 'bg-purple-500' },
  { key: 'PAID', label: 'Paid', color: 'bg-emerald-500' },
  { key: 'CLAWBACK', label: 'Clawback', color: 'bg-red-500' },
];

export const BONUS_BOARD_TYPE_CONFIG: Record<BonusType, { label: string; color: string }> = {
  SALES: { label: 'Sales', color: 'bg-blue-500/10 text-blue-600' },
  DELIVERY: { label: 'Delivery', color: 'bg-cyan-500/10 text-cyan-700' },
  PM: { label: 'PM', color: 'bg-purple-500/10 text-purple-600' },
  DESIGN: { label: 'Design', color: 'bg-pink-500/10 text-pink-600' },
  MARKETING: { label: 'Marketing', color: 'bg-amber-500/10 text-amber-700' },
};
