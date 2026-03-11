import type { StatusVariant } from '@/components/shared/StatusBadge';

export const DEAL_STAGES = [
  {
    key: 'START_CONVERSATION',
    label: 'Start a Conversation',
    variant: 'blue' as StatusVariant,
    color: 'bg-blue-400',
  },
  {
    key: 'DISCUSS_NEEDS',
    label: 'Discuss What Is Needed',
    variant: 'blue' as StatusVariant,
    color: 'bg-blue-500',
  },
  { key: 'MEETING', label: 'Meeting', variant: 'indigo' as StatusVariant, color: 'bg-indigo-500' },
  {
    key: 'CAN_WE_DO_IT',
    label: 'Can We Do It?',
    variant: 'purple' as StatusVariant,
    color: 'bg-purple-500',
  },
  {
    key: 'SEND_OFFER',
    label: 'Send Offer',
    variant: 'violet' as StatusVariant,
    color: 'bg-violet-500',
  },
  {
    key: 'GET_ANSWER',
    label: 'Get Answer',
    variant: 'fuchsia' as StatusVariant,
    color: 'bg-fuchsia-500',
  },
  {
    key: 'DEPOSIT_AND_CONTRACT',
    label: 'Deposit & Contract',
    variant: 'amber' as StatusVariant,
    color: 'bg-amber-500',
  },
  {
    key: 'CREATING',
    label: 'Creating',
    variant: 'orange' as StatusVariant,
    color: 'bg-orange-500',
  },
  {
    key: 'GET_FINAL_PAY',
    label: 'Get Final Pay',
    variant: 'emerald' as StatusVariant,
    color: 'bg-emerald-500',
  },
  {
    key: 'MAINTENANCE_OFFER',
    label: 'Maintenance Offer',
    variant: 'teal' as StatusVariant,
    color: 'bg-teal-500',
  },
  {
    key: 'FAILED',
    label: 'Failed',
    variant: 'red' as StatusVariant,
    color: 'bg-red-500',
    terminal: true,
  },
  {
    key: 'WON',
    label: 'Deal Won',
    variant: 'green' as StatusVariant,
    color: 'bg-green-600',
    terminal: true,
  },
] as const;

export const ACTIVE_DEAL_STAGES = DEAL_STAGES.filter((s) => !('terminal' in s));
export const TERMINAL_DEAL_STAGES = DEAL_STAGES.filter((s) => 'terminal' in s);

export const DEAL_TYPES = [
  { value: 'NEW_CLIENT', label: 'New Client' },
  { value: 'EXTENSION', label: 'Extension' },
  { value: 'UPSELL', label: 'Upsell' },
] as const;

export const PAYMENT_TYPES = [
  { value: 'UPFRONT', label: 'Upfront (100%)' },
  { value: 'SPLIT_50_50', label: '50/50' },
  { value: 'SPLIT_30_30_40', label: '30/30/40' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'MILESTONE', label: 'Milestone-based' },
] as const;

export function getDealStage(key: string) {
  return DEAL_STAGES.find((s) => s.key === key);
}

export function formatAmount(amount: number | null): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AMD',
    maximumFractionDigits: 0,
  }).format(amount);
}
