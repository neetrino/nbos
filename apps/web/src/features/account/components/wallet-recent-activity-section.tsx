import Link from 'next/link';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

interface WalletRecentActivitySectionProps {
  activity: EmployeeWalletSnapshot['activity'];
}

export function WalletRecentActivitySection({ activity }: WalletRecentActivitySectionProps) {
  return (
    <section className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-foreground text-sm font-semibold">Recent activity</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Latest payroll and bonus events tied to you (read-only).
      </p>
      {activity.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-xs">No recent events yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {activity.map((item) => (
            <li
              key={item.id}
              className="border-border flex flex-col gap-0.5 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-foreground text-xs font-medium">{item.title}</span>
                <time
                  className="text-muted-foreground text-[11px] tabular-nums"
                  dateTime={item.occurredAt}
                >
                  {item.occurredAt.slice(0, 10)}
                </time>
              </div>
              {item.detail ? (
                <p className="text-muted-foreground text-[11px] leading-snug">{item.detail}</p>
              ) : null}
              {item.linkHref ? (
                <Link
                  href={item.linkHref}
                  className="text-primary w-fit text-[11px] font-medium hover:underline"
                >
                  Open
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
