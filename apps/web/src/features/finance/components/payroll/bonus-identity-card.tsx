'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Box, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BonusSourceIdentityCard({
  projectHref,
  projectName,
  productLabel,
  orderCode,
}: {
  projectHref: string;
  projectName: string;
  productLabel: string;
  orderCode: string;
}) {
  return (
    <BonusIdentityShell icon={FolderKanban}>
      <IdentityField
        label="Project"
        value={
          <Link href={projectHref} className="text-primary font-semibold hover:underline">
            {projectName}
          </Link>
        }
      />
      <div className="border-border border-t" />
      <IdentityField
        label="Product"
        value={
          <span className="text-foreground font-semibold">
            {productLabel}
            <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
              Order {orderCode}
            </span>
          </span>
        }
      />
    </BonusIdentityShell>
  );
}

export function BonusReleaseIdentityCard({
  productLabel,
  orderCode,
  releaseBadge,
}: {
  productLabel: string;
  orderCode: string;
  releaseBadge: ReactNode;
}) {
  return (
    <BonusIdentityShell icon={Box}>
      <IdentityField
        label="Product"
        value={
          <span className="text-foreground font-semibold">
            {productLabel}
            <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
              Order {orderCode}
            </span>
          </span>
        }
      />
      <div className="border-border border-t" />
      <IdentityField label="Release" value={releaseBadge} />
    </BonusIdentityShell>
  );
}

function BonusIdentityShell({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="border-border bg-card flex h-full min-w-0 flex-col gap-2.5 rounded-2xl border p-3 shadow-sm">
      <span className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
        <Icon size={16} aria-hidden />
      </span>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function IdentityField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className={cn('mt-1 text-sm')}>{value}</div>
    </div>
  );
}
