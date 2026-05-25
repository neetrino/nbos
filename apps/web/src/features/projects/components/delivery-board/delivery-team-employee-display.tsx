'use client';

function initialsFromFullName(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const a = parts[0]![0] ?? '';
  const last = parts[parts.length - 1]!;
  const b = last[0] ?? '';
  return `${a}${b}`.toUpperCase();
}

/** Compact avatar + name row for delivery team pickers (matches sheet “card” look). */
export function DeliveryTeamEmployeeChoiceDisplay({ label }: { label: string }) {
  const initials = initialsFromFullName(label);
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="bg-primary/12 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase">
        {initials}
      </span>
      <span className="text-primary truncate text-sm leading-tight font-medium">{label}</span>
    </span>
  );
}
