import type { LucideIcon } from 'lucide-react';

export function ActiveCallSectionHeading(props: { title: string; icon: LucideIcon }) {
  const Icon = props.icon;
  return (
    <h2 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase">
      <span className="bg-background text-primary ring-border flex size-7 items-center justify-center rounded-lg ring-1">
        <Icon className="size-3.5" aria-hidden />
      </span>
      {props.title}
    </h2>
  );
}
