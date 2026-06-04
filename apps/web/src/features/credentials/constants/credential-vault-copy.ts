import { cn } from '@/lib/utils';

/** Green flash duration after login/password copy on vault cards and sheet fields. */
export const CREDENTIAL_VAULT_COPY_FEEDBACK_MS = 1000;

/** Shared emerald highlight for vault copy targets (pills, inputs). */
export const CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS = cn(
  'bg-emerald-500/15 text-emerald-800 shadow-[inset_0_0_0_1px_rgb(16_185_129/0.45)]',
  'ring-emerald-500/45 ring-1 transition-[background-color,box-shadow] duration-200',
  'dark:text-emerald-300',
);
