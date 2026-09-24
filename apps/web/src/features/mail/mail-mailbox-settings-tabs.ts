import { LayoutGrid, Users } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const MAIL_MAILBOX_SETTINGS_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'access', label: 'Manual access', icon: Users },
] as const satisfies readonly DetailSheetTabItem[];

export type MailMailboxSettingsTab = (typeof MAIL_MAILBOX_SETTINGS_TABS)[number]['value'];
