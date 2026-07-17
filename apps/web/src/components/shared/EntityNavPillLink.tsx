import Link from 'next/link';
import { ChevronRight, ExternalLink, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENTITY_NAV_PILL_CLASS =
  'bg-primary text-primary-foreground inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-opacity hover:opacity-90';

interface EntityNavPillLinkBase {
  label: string;
  icon: LucideIcon;
  className?: string;
  /** Page navigation — shows external-link trailing icon. Default: sheet open (chevron). */
  opensPage?: boolean;
}

type EntityNavPillLinkProps =
  | (EntityNavPillLinkBase & { href: string; onOpen?: never })
  | (EntityNavPillLinkBase & { onOpen: () => void; href?: never });

/** Primary pill CTA for sheet/panel navigation (icon + label + chevron / external). */
export function EntityNavPillLink({
  label,
  icon: Icon,
  className,
  opensPage = false,
  ...action
}: EntityNavPillLinkProps) {
  const TrailingIcon = opensPage ? ExternalLink : ChevronRight;

  const body = (
    <>
      <Icon size={13} className="shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
      <TrailingIcon size={12} className="text-primary-foreground/70 shrink-0" aria-hidden />
    </>
  );

  if ('href' in action && action.href) {
    return (
      <Link href={action.href} className={cn(ENTITY_NAV_PILL_CLASS, className)}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onOpen} className={cn(ENTITY_NAV_PILL_CLASS, className)}>
      {body}
    </button>
  );
}
