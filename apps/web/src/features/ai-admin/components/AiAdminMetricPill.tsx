import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_ADMIN_ICON_ACCENT_CLASS, AI_ADMIN_PILL_CLASS } from '../ai-admin-ui.constants';

export function AiAdminMetricPill(props: { icon: LucideIcon; text: string }) {
  const Icon = props.icon;
  return (
    <span className={AI_ADMIN_PILL_CLASS}>
      <Icon className={cn('size-3.5 shrink-0', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
      <span className="truncate">{props.text}</span>
    </span>
  );
}
