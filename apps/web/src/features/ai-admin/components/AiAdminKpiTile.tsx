import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_ADMIN_CARD_CLASS, AI_ADMIN_CARD_INTERACTIVE_CLASS } from '../ai-admin-ui.constants';
import { AiAdminIconTile } from './AiAdminIconTile';

export function AiAdminKpiTile(props: {
  href: string;
  icon: LucideIcon;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Link
      href={props.href}
      className={cn(
        AI_ADMIN_CARD_CLASS,
        AI_ADMIN_CARD_INTERACTIVE_CLASS,
        'flex h-full min-h-[7.5rem] flex-col p-4',
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <AiAdminIconTile icon={props.icon} size="sm" />
        <h2 className="text-sm font-semibold tracking-tight">{props.title}</h2>
      </div>
      <p className="text-foreground text-2xl font-semibold tracking-tight">{props.value}</p>
      <p className="text-muted-foreground mt-auto pt-2 text-xs leading-relaxed">{props.detail}</p>
    </Link>
  );
}
