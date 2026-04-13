'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    firstName: z.string().min(1, 'Required').max(50),
    lastName: z.string().min(1, 'Required').max(50),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

interface InviteInfo {
  email: string;
  roleName: string;
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setInviteError('No invitation token provided');
      return;
    }

    fetch(`/api/v1/auth/invite-info?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Invalid or expired invitation');
        const body = (await res.json()) as { data: InviteInfo };
        setInviteInfo(body.data);
      })
      .catch(() => setInviteError('This invitation is invalid or has expired'));
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);

    const res = await fetch('/api/v1/auth/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
      }),
    });

    if (!res.ok) {
      const body = (await res.json()) as { message?: string };
      setSubmitError(body.message ?? 'Something went wrong. Please try again.');
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/sign-in'), 2500);
  }

  if (inviteError) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-destructive/10 text-destructive rounded-xl p-6">
            <p className="font-medium">Invitation Error</p>
            <p className="mt-1 text-sm">{inviteError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-accent/10 rounded-xl p-6">
            <UserCheck className="text-accent mx-auto mb-3" size={40} />
            <p className="text-foreground font-semibold">Account created!</p>
            <p className="text-muted-foreground mt-1 text-sm">Redirecting to sign in…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="bg-accent mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
            <span className="text-accent-foreground text-lg font-bold">N</span>
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          {inviteInfo && (
            <p className="text-muted-foreground mt-1 text-sm">
              Invited as <span className="text-foreground font-medium">{inviteInfo.roleName}</span>
              {' · '}
              {inviteInfo.email}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstName"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                First name
              </label>
              <input
                id="firstName"
                type="text"
                autoFocus
                {...register('firstName')}
                className={cn(
                  'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2',
                  errors.firstName && 'border-destructive',
                )}
              />
              {errors.firstName && (
                <p className="text-destructive mt-1 text-xs">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                className={cn(
                  'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2',
                  errors.lastName && 'border-destructive',
                )}
              />
              {errors.lastName && (
                <p className="text-destructive mt-1 text-xs">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-foreground mb-1.5 block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={cn(
                  'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 pr-10 text-sm transition-colors outline-none focus-visible:ring-2',
                  errors.password && 'border-destructive',
                )}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive mt-1 text-xs">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-foreground mb-1.5 block text-sm font-medium"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              className={cn(
                'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2',
                errors.confirmPassword && 'border-destructive',
              )}
              placeholder="Repeat password"
            />
            {errors.confirmPassword && (
              <p className="text-destructive mt-1 text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>

          {submitError && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2.5 text-sm">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !inviteInfo}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="border-primary-foreground/30 border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            ) : (
              <UserCheck size={16} />
            )}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={<div className="bg-background flex min-h-screen items-center justify-center" />}
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
