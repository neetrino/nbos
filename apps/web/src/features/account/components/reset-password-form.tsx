'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import {
  ACCOUNT_PASSWORD_COMPLEXITY,
  ACCOUNT_PASSWORD_HINT,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
} from '@/features/account/constants/account-password-policy';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(ACCOUNT_PASSWORD_MIN_LENGTH, `At least ${ACCOUNT_PASSWORD_MIN_LENGTH} characters`)
      .max(ACCOUNT_PASSWORD_MAX_LENGTH)
      .regex(ACCOUNT_PASSWORD_COMPLEXITY, 'Must include at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm({
  token,
  email,
  onSuccess,
}: {
  token: string;
  email?: string;
  onSuccess: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await authApi.resetPassword({ token, newPassword: values.newPassword });
      onSuccess();
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Could not reset password.'));
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      {email ? (
        <p className="text-muted-foreground text-sm">
          Resetting password for <span className="text-foreground font-medium">{email}</span>
        </p>
      ) : null}

      <div>
        <Label
          htmlFor="reset-new-password"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          New password
        </Label>
        <div className="relative">
          <Input
            id="reset-new-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={cn(errors.newPassword && 'border-destructive', 'pr-10')}
            {...register('newPassword')}
          />
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.newPassword ? (
          <p className="text-destructive mt-1 text-xs">{errors.newPassword.message}</p>
        ) : (
          <p className="text-muted-foreground mt-1 text-xs">{ACCOUNT_PASSWORD_HINT}</p>
        )}
      </div>

      <div>
        <Label
          htmlFor="reset-confirm-password"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          Confirm new password
        </Label>
        <Input
          id="reset-confirm-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          className={cn(errors.confirmPassword && 'border-destructive')}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p className="text-destructive mt-1 text-xs">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      {formError ? <p className="text-destructive text-xs">{formError}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <KeyRound size={16} />
        {isSubmitting ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  );
}
