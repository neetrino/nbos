import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENTITY_NAV_PILL_CLASS =
  'bg-primary text-primary-foreground inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-opacity hover:opacity-90';

interface EntityNavPillLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  className?: string;
}

/** Primary pill CTA for sheet/panel navigation (icon + label + chevron). */
export function EntityNavPillLink({ href, label, icon: Icon, className }: EntityNavPillLinkProps) {
  return (
    <Link href={href} className={cn(ENTITY_NAV_PILL_CLASS, className)}>
      <Icon size={13} className="shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
      <ChevronRight size={12} className="text-primary-foreground/70 shrink-0" aria-hidden />
    </Link>
  );
}
