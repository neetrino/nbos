'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setAuthError(null);

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError('Invalid email or password');
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/logo/logo.svg" alt="NBOS" width={172} height={28} className="h-7 w-auto" />
          </div>
          <p className="text-muted-foreground text-base font-medium">
            Enter your credentials and sing in
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="text-foreground mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              className={cn(
                'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2',
                errors.email && 'border-destructive',
              )}
              placeholder="you@company.com"
            />
            {errors.email && (
              <p className="text-destructive mt-1 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="text-foreground mb-1.5 block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className={cn(
                  'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 pr-10 text-sm transition-colors outline-none focus-visible:ring-2',
                  errors.password && 'border-destructive',
                )}
                placeholder="••••••••"
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

          {/* Auth error */}
          {authError && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2.5 text-sm">
              {authError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="border-primary-foreground/30 border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            ) : (
              <LogIn size={16} />
            )}
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
