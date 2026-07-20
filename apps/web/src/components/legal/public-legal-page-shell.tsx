import Link from 'next/link';
import type { ReactNode } from 'react';
import { PublicSiteFooterLinks } from './public-site-footer-links';

interface PublicLegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function PublicLegalPageShell({ title, lastUpdated, children }: PublicLegalPageShellProps) {
  return (
    <div className="bg-background text-foreground min-h-dvh overflow-x-hidden">
      <header className="border-border/60 bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- legal page logo SVG */}
            <img
              src="/logo/logo.svg"
              alt="NBOS"
              width={168}
              height={28}
              className="h-6 w-auto max-w-[min(100%,9.5rem)] sm:h-7 sm:max-w-none"
            />
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex min-h-10 shrink-0 items-center px-2 text-sm transition-colors sm:min-h-0"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">Last updated: {lastUpdated}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed break-words sm:mt-10 sm:space-y-10">
          {children}
        </div>
      </main>

      <footer className="border-border/60 border-t py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left">
          <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- legal page footer logo SVG */}
            <img
              src="/logo/logo.svg"
              alt="NBOS"
              width={120}
              height={20}
              className="h-5 w-auto shrink-0"
            />
            <span className="truncate">NBOS by Neetrino</span>
          </div>
          <PublicSiteFooterLinks />
        </div>
      </footer>
    </div>
  );
}

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground mt-3 space-y-3">{children}</div>
    </section>
  );
}
