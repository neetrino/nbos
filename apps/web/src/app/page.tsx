import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTHENTICATED_APP_HOME_PATH } from '@/lib/auth/authenticated-root-redirect';
import { PublicSiteFooterLinks } from '@/components/legal/public-site-footer-links';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  DollarSign,
  CheckSquare,
  Headphones,
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: 'CRM',
    desc: 'Leads, deals, and client management in one place.',
  },
  {
    icon: FolderKanban,
    title: 'Projects',
    desc: 'Track projects, deals, and deliverables from start to finish.',
  },
  {
    icon: DollarSign,
    title: 'Finance',
    desc: 'Orders, invoices, payments, subscriptions, and expense tracking.',
  },
  {
    icon: CheckSquare,
    title: 'Tasks',
    desc: 'Kanban boards, assignments, priorities, and sprint planning.',
  },
  {
    icon: Headphones,
    title: 'Support',
    desc: 'Ticketing system with SLA tracking and client communication.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Dashboards with real-time insights across all departments.',
  },
];

const HIGHLIGHTS = [
  { icon: Zap, text: 'Fast and modern — built with Next.js and NestJS' },
  { icon: Shield, text: 'Secure — own auth, encrypted credentials, role-based access' },
  { icon: LayoutDashboard, text: 'All-in-one — CRM, Finance, Projects, Tasks, Support, Drive' },
];

const PRIMARY_BTN =
  'bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors sm:min-h-0 sm:px-7 sm:py-3.5';

const SECONDARY_BTN =
  'border-border hover:bg-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors sm:min-h-0 sm:px-7 sm:py-3.5';

const CTA_ROW =
  'mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-4';

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect(AUTHENTICATED_APP_HOME_PATH);
  }

  return (
    <div className="bg-background text-foreground min-h-dvh overflow-x-hidden">
      <nav className="border-border/60 bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
          <div className="min-w-0 shrink">
            {/* eslint-disable-next-line @next/next/no-img-element -- landing logo SVG; fixed dimensions, no next/image benefit */}
            <img
              src="/logo/logo.svg"
              alt="NBOS"
              width={168}
              height={28}
              fetchPriority="high"
              className="h-6 w-auto max-w-[min(100%,9.5rem)] sm:h-7 sm:max-w-none"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              href="/sign-in"
              className="text-muted-foreground hover:text-foreground inline-flex min-h-10 items-center rounded-xl px-2.5 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:px-4"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:px-5 sm:py-2.5"
            >
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Join with invite</span>
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 pt-12 pb-14 text-center sm:px-6 sm:pt-24 sm:pb-20">
        <div className="bg-accent/10 text-accent mx-auto mb-5 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-left text-xs font-medium sm:mb-6 sm:px-4">
          <Zap size={14} className="shrink-0" aria-hidden />
          <span className="min-w-0">Business Operation System</span>
        </div>

        <h1 className="mx-auto max-w-3xl text-[2rem] leading-[1.15] font-bold tracking-tight sm:text-5xl sm:leading-[1.1] md:text-6xl">
          Run your agency
          <span className="text-accent"> smarter</span>, not harder
        </h1>

        <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base leading-relaxed sm:mt-6 sm:text-lg">
          NBOS unifies CRM, project management, finance, tasks, and support into a single platform
          built for digital agencies.
        </p>

        <div className={CTA_ROW}>
          <Link href="/sign-up" className={PRIMARY_BTN}>
            Join with invite
            <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href="/sign-in" className={SECONDARY_BTN}>
            Sign In
          </Link>
        </div>

        <ul className="mt-12 flex list-none flex-col items-stretch gap-3 p-0 sm:mt-16 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8 sm:gap-y-4">
          {HIGHLIGHTS.map((h) => (
            <li
              key={h.text}
              className="text-muted-foreground flex items-start gap-2.5 text-left text-sm sm:max-w-xs sm:items-center sm:justify-center sm:text-center"
            >
              <h.icon size={16} className="text-accent mt-0.5 shrink-0 sm:mt-0" aria-hidden />
              <span className="min-w-0">{h.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-border/60 border-t py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Everything you need to operate
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-base sm:mt-4 sm:text-lg">
              Six core modules that cover every aspect of your business.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border-border bg-card group rounded-2xl border p-5 transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground flex h-10 w-10 items-center justify-center rounded-xl transition-colors sm:h-11 sm:w-11">
                  <f.icon size={20} aria-hidden />
                </div>
                <h3 className="text-foreground mt-3 text-base font-semibold sm:mt-4 sm:text-lg">
                  {f.title}
                </h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed sm:mt-2">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border/60 border-t py-14 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mt-3 text-base sm:mt-4 sm:text-lg">
            Access is by invitation. Use your invite link to activate your account, or sign in if
            you already have one.
          </p>
          <div className={`${CTA_ROW} mx-auto`}>
            <Link href="/sign-up" className={PRIMARY_BTN}>
              How to join
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link href="/sign-in" className={SECONDARY_BTN}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-border/60 border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left">
          <div className="text-muted-foreground flex min-w-0 items-center justify-center gap-2 text-sm sm:justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- footer logo SVG; fixed dimensions, no next/image benefit */}
            <img
              src="/logo/logo.svg"
              alt="NBOS"
              width={120}
              height={20}
              className="h-5 w-auto shrink-0"
            />
            <span className="truncate">NBOS by Neetrino</span>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <PublicSiteFooterLinks />
            <p className="text-muted-foreground text-xs">
              &copy; {new Date().getFullYear()} Neetrino. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
