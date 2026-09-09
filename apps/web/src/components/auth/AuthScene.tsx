import type { ReactNode } from 'react';
import { PublicSiteFooterLinks } from '@/components/legal/public-site-footer-links';
import { AuthLedgerArt } from './AuthLedgerArt';

interface AuthSceneProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthScene({
  eyebrow = 'Sign in',
  title,
  description,
  children,
  footer,
}: AuthSceneProps) {
  return (
    <div className="nbos-auth-scene">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:p-4">
        <section className="overflow-hidden lg:rounded-[1.75rem]">
          <AuthLedgerArt />
        </section>
        <section className="flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-sm">
            <p className="nbos-desk-kicker">{eyebrow}</p>
            <h2 className="nbos-display text-foreground mt-2 text-3xl">{title}</h2>
            {description ? (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
            ) : null}
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-6">{footer}</div> : null}
            <div className="mt-10 flex justify-center">
              <PublicSiteFooterLinks />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
