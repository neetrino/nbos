import Link from 'next/link';

const LEGAL_LINK_CLASS =
  'text-muted-foreground hover:text-foreground inline-flex min-h-9 items-center text-xs transition-colors underline-offset-4 hover:underline';

export function PublicSiteFooterLinks() {
  return (
    <nav
      aria-label="Legal"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end"
    >
      <Link href="/privacy-policy" className={LEGAL_LINK_CLASS}>
        Privacy Policy
      </Link>
      <Link href="/data-deletion" className={LEGAL_LINK_CLASS}>
        Data Deletion
      </Link>
    </nav>
  );
}
