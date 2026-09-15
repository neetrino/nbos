'use client';

import Link from 'next/link';
import { ExternalLink, HardDrive, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { buildDriveHrefWithFinanceProject } from '@/features/drive/drive-deep-link';
import { cn } from '@/lib/utils';

interface ProductFinanceHeroTrailingProps {
  projectId: string;
  openFinanceHref: string;
  showCreateSubscription: boolean;
  onCreateSubscription: () => void;
}

export function ProductFinanceHeroTrailing({
  projectId,
  openFinanceHref,
  showCreateSubscription,
  onCreateSubscription,
}: ProductFinanceHeroTrailingProps) {
  return (
    <>
      {showCreateSubscription ? (
        <Button type="button" size="sm" onClick={onCreateSubscription}>
          <Plus size={16} aria-hidden />
          New Subscription
        </Button>
      ) : null}
      <Link
        href={buildDriveHrefWithFinanceProject(projectId)}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
      >
        <HardDrive size={14} aria-hidden />
        Drive
      </Link>
      <Link
        href={openFinanceHref}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
      >
        Finance
        <ExternalLink size={12} className="opacity-70" aria-hidden />
      </Link>
    </>
  );
}
