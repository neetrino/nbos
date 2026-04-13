import Link from 'next/link';
import { auth } from '@/auth';
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
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-accent-foreground text-sm font-bold">N</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">NBOS</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-muted-foreground hover:text-foreground rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
        <div className="bg-accent/10 text-accent mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium">
          <Zap size={14} />
          Business Operation System
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl leading-[1.1] font-bold tracking-tight sm:text-6xl">
          Run your agency
          <span className="text-accent"> smarter</span>, not harder
        </h1>

        <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-relaxed">
          NBOS unifies CRM, project management, finance, tasks, and support into a single platform
          built for digital agencies.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-colors"
            >
              Open Dashboard
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-colors"
              >
                Start Free
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/sign-in"
                className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Highlights */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          {HIGHLIGHTS.map((h) => (
            <div key={h.text} className="text-muted-foreground flex items-center gap-2 text-sm">
              <h.icon size={16} className="text-accent" />
              {h.text}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-border/60 border-t py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to operate
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
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
      <section className="border-border/60 border-t py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to get started?</h2>
          <p className="text-muted-foreground mt-4 text-lg">
            {user
              ? 'Your workspace is ready. Jump into the dashboard.'
              : 'Create your account and start managing your agency in minutes.'}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-colors"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-colors"
                >
                  Create Account
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/sign-in"
                  className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-medium transition-colors"
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="bg-accent flex h-6 w-6 items-center justify-center rounded-md">
              <span className="text-accent-foreground text-[10px] font-bold">N</span>
            </div>
            NBOS by Neetrino
          </div>
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Neetrino. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
