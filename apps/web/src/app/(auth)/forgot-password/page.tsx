'use client';

import { useRouter } from 'next/navigation';
import { ForgotPasswordForm } from '@/features/account/components/forgot-password-form';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- auth logo SVG; fixed dimensions, no next/image benefit */}
            <img src="/logo/logo.svg" alt="NBOS" width={168} height={28} className="h-7 w-auto" />
          </div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">Forgot password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your work email and we will send a reset link.
          </p>
        </div>
        <ForgotPasswordForm onBack={() => router.push('/sign-in')} />
      </div>
    </div>
  );
}
