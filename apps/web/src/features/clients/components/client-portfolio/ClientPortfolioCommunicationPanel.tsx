'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PORTFOLIO_MESSENGER_HREF } from '../../constants/client-portfolio-deep-links';

export function ClientPortfolioCommunicationPanel() {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Messenger is the full conversation. Open it to read and write messages with this client.
      </p>
      <Link
        href={PORTFOLIO_MESSENGER_HREF}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'inline-flex w-fit gap-2',
        )}
      >
        Open Messenger
      </Link>
    </div>
  );
}
