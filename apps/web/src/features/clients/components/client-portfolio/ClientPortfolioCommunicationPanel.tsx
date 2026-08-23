'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  ContactPortfolioResponse,
  CompanyPortfolioResponse,
} from '@/lib/api/client-portfolio';
import { PORTFOLIO_MESSENGER_HREF } from '../../constants/client-portfolio-deep-links';
import { ContactCallActivityTimeline } from './ContactCallActivityTimeline';

export function ClientPortfolioCommunicationPanel(props: {
  data: ContactPortfolioResponse | CompanyPortfolioResponse;
  contactId: string | null;
}) {
  return (
    <div className="space-y-4">
      {props.data.scope === 'contact' && props.contactId ? (
        <ContactCallActivityTimeline contactId={props.contactId} />
      ) : (
        <p className="text-muted-foreground text-sm">
          A unified timeline (Messenger, calls, notes) will appear here when the aggregation API is
          available.
        </p>
      )}
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
