import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, UserPlus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Join NBOS — Business Operation System',
  description: 'NBOS accounts are created by invitation only.',
};

export default function SignUpInfoPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/logo/logo.svg" alt="NBOS" width={172} height={28} className="h-7 w-auto" />
          </div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Join your workspace
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            NBOS uses <span className="text-foreground font-medium">invitation-only</span> access.
            Ask your administrator for an invite link, then complete your profile on the acceptance
            page.
          </p>
        </div>

        <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
          <div className="flex gap-3">
            <div className="bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <Mail className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Have an invitation email?</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Open the link from your invite (it includes a token), or go to Accept invite and
                paste the token if your admin shared it separately.
              </p>
              <Link
                href="/accept-invite"
                className="text-accent mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
              >
                Accept invitation
              </Link>
            </div>
          </div>

          <div className="border-border flex gap-3 border-t pt-4">
            <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <UserPlus className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Already have an account?</p>
              <Link
                href="/sign-in"
                className="text-accent mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground mt-8 text-center text-xs leading-relaxed">
          Public self-registration is not available. This keeps NBOS aligned with internal access
          policies.
        </p>
      </div>
    </div>
  );
}
