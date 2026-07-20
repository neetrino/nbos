import Link from 'next/link';
import { auth } from '@/auth';
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

export default async function LandingPage() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Navbar */}
      <nav className="border-border/60 border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
          <div className="min-w-0 shrink">
            {/* eslint-disable-next-line @next/next/no-img-element -- landing logo SVG; fixed dimensions, no next/image benefit */}
            <img
              src="/logo/logo.svg"
              alt="NBOS"
              width={168}
              height={28}
              fetchPriority="high"
              className="h-6 w-auto max-w-full sm:h-7"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:gap-2 sm:px-5 sm:py-2.5"
              >
                <LayoutDashboard size={16} className="hidden sm:block" />
                <span className="sm:hidden">Dashboard</span>
                <span className="hidden sm:inline">Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-muted-foreground hover:text-foreground rounded-xl px-2.5 py-2 text-sm font-medium transition-colors sm:px-4"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:px-5 sm:py-2.5"
                >
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">Join with invite</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-16 text-center sm:px-6 sm:pt-24 sm:pb-20">
        <div className="bg-accent/10 text-accent mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium">
          <Zap size={14} />
          Business Operation System
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl md:text-6xl">
          Run your agency
          <span className="text-accent"> smarter</span>, not harder
        </h1>

        <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
          NBOS unifies CRM, project management, finance, tasks, and support into a single platform
          built for digital agencies.
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-colors"
            >
              Open Dashboard
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-colors"
              >
                Join with invite
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/sign-in"
                className="border-border hover:bg-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Highlights */}
        <div className="mt-12 flex flex-col items-start gap-4 sm:mt-16 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-8">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.text}
              className="text-muted-foreground flex items-start gap-2 text-left text-sm sm:items-center sm:text-center"
            >
              <h.icon size={16} className="text-accent mt-0.5 shrink-0 sm:mt-0" />
              {h.text}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-border/60 border-t py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Everything you need to operate
            </h2>
            <p className="text-muted-foreground mt-4 text-base sm:text-lg">
              Six core modules that cover every aspect of your business.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border-border bg-card group rounded-2xl border p-6 transition-shadow hover:shadow-md"
              >
                <div className="bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground flex h-11 w-11 items-center justify-center rounded-xl transition-colors">
                  <f.icon size={20} />
                </div>
                <h3 className="text-foreground mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-border/60 border-t py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">
            {user
              ? 'Your workspace is ready. Jump into the dashboard.'
              : 'Access is by invitation. Use your invite link to activate your account, or sign in if you already have one.'}
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-colors"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-colors"
                >
                  How to join
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/sign-in"
                  className="border-border hover:bg-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border/60 border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
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
          <div className="flex flex-col items-start gap-2 sm:items-end">
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
