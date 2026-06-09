'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHero, EmptyState } from '@/components/shared';
import { MailThreadDetailContent } from '@/features/mail/MailThreadDetailContent';
import { useMailThreadDetail } from '@/features/mail/use-mail-thread-detail';
import { usePermission } from '@/lib/permissions';

export default function MailThreadDetailPage() {
  const params = useParams();
  const threadId = typeof params.threadId === 'string' ? params.threadId : '';
  const { can } = usePermission();
  const canView = can('VIEW', 'MAIL');
  const canEdit = can('EDIT', 'MAIL');
  const detailState = useMailThreadDetail({ threadId, enabled: canView && Boolean(threadId) });

  if (!canView) {
    return (
      <div className="flex h-full flex-col gap-5">
        <PageHero title="Mail" />
        <EmptyState
          icon={Mail}
          title="No access"
          description="You do not have permission to view Mail."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          href="/mail"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
        >
          <ArrowLeft size={16} /> Inbox
        </Link>
      </div>

      <MailThreadDetailContent threadId={threadId} canEdit={canEdit} detailState={detailState} />
    </div>
  );
}
