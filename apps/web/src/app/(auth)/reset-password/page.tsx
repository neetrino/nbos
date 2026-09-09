'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { AuthScene } from '@/components/auth/AuthScene';
import { ResetPasswordForm } from '@/features/account/components/reset-password-form';
import { authApi } from '@/lib/api/auth';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [email, setEmail] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(
    token ? null : 'No reset token provided',
  );
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void authApi
      .getResetPasswordInfo(token)
      .then((info) => {
        if (!cancelled) setEmail(info.email);
      })
      .catch(() => {
        if (!cancelled) setTokenError('This reset link is invalid or has expired');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (tokenError) {
    return (
      <AuthScene eyebrow="Recover access" title="Reset link error">
        <ResetStatusCard tone="error" title="Reset link error" body={tokenError} />
      </AuthScene>
    );
  }

  if (success) {
    return (
      <AuthScene eyebrow="Recover access" title="Password updated">
        <ResetStatusCard
          tone="success"
          title="Password updated"
          body="You can sign in with your new password."
        />
      </AuthScene>
    );
  }

  return (
    <AuthScene
      eyebrow="Recover access"
      title="Set a new password"
      description="Choose a password you have not used before."
    >
      <ResetPasswordForm
        token={token}
        email={email ?? undefined}
        onSuccess={() => {
          setSuccess(true);
          window.setTimeout(() => router.push('/sign-in'), 2000);
        }}
      />
    </AuthScene>
  );
}

function ResetStatusCard({
  tone,
  title,
  body,
}: {
  tone: 'error' | 'success';
  title: string;
  body: string;
}) {
  const isError = tone === 'error';
  return (
    <div
      className={
        isError
          ? 'bg-destructive/10 text-destructive rounded-xl p-6 text-center'
          : 'bg-accent/10 rounded-xl p-6 text-center'
      }
    >
      {isError ? null : <KeyRound className="text-accent mx-auto mb-3" size={40} />}
      <p className={isError ? 'font-medium' : 'text-foreground font-semibold'}>{title}</p>
      <p className={isError ? 'mt-1 text-sm' : 'text-muted-foreground mt-1 text-sm'}>{body}</p>
      <Link
        href="/sign-in"
        className="text-foreground mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
      >
        {isError ? 'Back to sign in' : 'Sign in'}
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="bg-background flex min-h-screen items-center justify-center" />}
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
