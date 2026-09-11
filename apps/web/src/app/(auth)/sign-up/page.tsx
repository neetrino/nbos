import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, UserPlus } from 'lucide-react';
import { AuthScene } from '@/components/auth/AuthScene';

export const metadata: Metadata = {
  title: 'Join NBOS — Business Operation System',
  description: 'NBOS accounts are created by invitation only.',
};

export default function SignUpInfoPage() {
  return (
    <AuthScene
      eyebrow="Invitation only"
      title="Join your workspace"
      description="NBOS does not offer public self-registration. Ask an administrator for an invite."
    >
      <div className="nbos-desk-surface space-y-4 p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Mail className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Have an invitation email?</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Open the link from your invite, or go to Accept invite and paste the token if your
              admin shared it separately.
            </p>
            <Link
              href="/accept-invite"
              className="text-primary mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
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
              className="text-primary mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </AuthScene>
  );
}
