'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  CompanyPortfolioResponse,
  ContactPortfolioResponse,
} from '@/lib/api/client-portfolio';
import { buildPortfolioClientMessengerHref } from '../../constants/client-portfolio-deep-links';
import { portfolioClientMessengerLabel } from './portfolio-client-messenger-label';

export function ClientPortfolioCommunicationPanel({
  data,
  entityId,
}: {
  data: ContactPortfolioResponse | CompanyPortfolioResponse;
  entityId: string;
}) {
  const label = portfolioClientMessengerLabel(data);
  const href = buildPortfolioClientMessengerHref({ variant: data.scope, entityId });
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Client Messenger keeps this conversation. Open it to read and write with {label}.
      </p>
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'inline-flex w-fit gap-2',
        )}
      >
        Open Client Messenger
      </Link>
    </div>
  );
}
