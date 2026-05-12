'use client';

import Link from 'next/link';
import { ExternalLink, FolderKanban, GitBranch, Globe, Rocket } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';

interface DeliveryItemKeyWorkLinksSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  product: FullProduct | null;
  extension: FullExtension | null;
  workSpaceHref: string;
}

function ExternalLinkButton({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        buttonVariants({ variant: 'secondary', size: 'sm' }),
        'inline-flex w-full items-center gap-2',
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <ExternalLink className="size-3.5 shrink-0 opacity-50" aria-hidden />
    </a>
  );
}

export function DeliveryItemKeyWorkLinksSection({
  kind,
  product,
  extension,
  workSpaceHref,
}: DeliveryItemKeyWorkLinksSectionProps) {
  const profile =
    kind === 'PRODUCT'
      ? product?.technicalProfiles?.[0]
      : extension?.product?.technicalProfiles?.[0];

  return (
    <section className="border-border bg-card/40 rounded-xl border p-4">
      <h3 className="text-muted-foreground mb-2.5 text-[10px] font-semibold tracking-wider uppercase">
        Key work links
      </h3>
      <div className="flex flex-col gap-1.5">
        {workSpaceHref && workSpaceHref !== '#' ? (
          <Link
            href={workSpaceHref}
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'inline-flex w-full items-center gap-2',
            )}
          >
            <FolderKanban size={14} aria-hidden />
            Work Space
          </Link>
        ) : null}
        {profile?.repositoryUrl ? (
          <ExternalLinkButton
            label="Repository"
            href={profile.repositoryUrl}
            icon={<GitBranch size={14} aria-hidden />}
          />
        ) : null}
        {profile?.stagingUrl ? (
          <ExternalLinkButton
            label="Staging"
            href={profile.stagingUrl}
            icon={<Rocket size={14} aria-hidden />}
          />
        ) : null}
        {profile?.productionUrl ? (
          <ExternalLinkButton
            label="Production"
            href={profile.productionUrl}
            icon={<Globe size={14} aria-hidden />}
          />
        ) : null}
        {!profile?.repositoryUrl && !profile?.stagingUrl && !profile?.productionUrl ? (
          <p className="text-muted-foreground text-xs">
            Add repository and environment URLs on the product technical profile when available.
          </p>
        ) : null}
      </div>
    </section>
  );
}
