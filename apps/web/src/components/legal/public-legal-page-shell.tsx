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
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- legal page logo SVG */}
            <img src="/logo/logo.svg" alt="NBOS" width={168} height={28} className="h-7 w-auto" />
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">Last updated: {lastUpdated}</p>
        <div className="mt-10 space-y-10 text-sm leading-relaxed">{children}</div>
      </main>

      <footer className="border-border/60 border-t py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- legal page footer logo SVG */}
            <img src="/logo/logo.svg" alt="NBOS" width={120} height={20} className="h-5 w-auto" />
            NBOS by Neetrino
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
