'use client';

import Link from 'next/link';
import { ExternalLink, FolderKanban } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { PARTNER_OPEN_QUERY } from '@/features/partners/constants/partner-open-query';
import type { Subscription } from '@/lib/api/finance';

export function SubscriptionDetailLinkedPanel({ subscription }: { subscription: Subscription }) {
  return (
    <DetailSheetSection title="Linked">
      <div className="space-y-2 text-sm">
        <LinkRow
          icon={FolderKanban}
          value={subscription.project.name}
          href={`/projects/${subscription.projectId}`}
        />
        {subscription.company ? (
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">{subscription.company.name}</span>
          </p>
        ) : null}
        {subscription.partner ? (
          <LinkRow
            icon={ExternalLink}
            value={subscription.partner.name}
            href={`/partners?${PARTNER_OPEN_QUERY}=${encodeURIComponent(subscription.partner.id)}`}
          />
        ) : null}
      </div>
    </DetailSheetSection>
  );
}

function LinkRow({
  icon: Icon,
  value,
  href,
}: {
  icon: typeof FolderKanban;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
    >
      <Icon size={14} aria-hidden />
      {value}
      <ExternalLink size={12} className="opacity-70" aria-hidden />
    </Link>
  );
}
