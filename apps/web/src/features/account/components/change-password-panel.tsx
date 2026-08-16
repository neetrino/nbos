'use client';

import { useState, type ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ForgotPasswordForm } from '@/features/account/components/forgot-password-form';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import {
  ACCOUNT_PASSWORD_COMPLEXITY,
  ACCOUNT_PASSWORD_HINT,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
} from '@/features/account/constants/account-password-policy';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
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
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordPanel({ accountEmail }: { accountEmail?: string }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null);
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success('Password updated. Sign in again with your new password.');
      await signOut({ callbackUrl: '/sign-in' });
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Could not change password.'));
    }
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-start gap-3">
        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <KeyRound className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">Change password</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Updates your NBOS sign-in password. All other sessions will be signed out, and you will
            need to sign in again on this device.
          </p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
      >
        <PasswordField
          id="current-password"
          label="Current password"
          autoComplete="current-password"
          show={showCurrent}
          onToggleShow={() => setShowCurrent((value) => !value)}
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          show={showNew}
          onToggleShow={() => setShowNew((value) => !value)}
          hint={ACCOUNT_PASSWORD_HINT}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          show={showNew}
          onToggleShow={() => setShowNew((value) => !value)}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {formError ? <p className="text-destructive text-xs">{formError}</p> : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-left text-sm font-medium underline-offset-4 hover:underline"
            onClick={() => setForgotOpen(true)}
          >
            Forgot password?
          </button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>

      <ForgotPasswordResetDialog
        open={forgotOpen}
        accountEmail={accountEmail}
        onOpenChange={setForgotOpen}
      />
    </div>
  );
}

function ForgotPasswordResetDialog({
  open,
  accountEmail,
  onOpenChange,
}: {
  open: boolean;
  accountEmail?: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent forceNestedBackdrop className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Forgot password</DialogTitle>
          <DialogDescription>
            We will email a reset link. You can set a new password without the current one.
          </DialogDescription>
        </DialogHeader>
        <ForgotPasswordForm
          defaultEmail={accountEmail}
          backLabel="Close"
          onBack={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
  show: boolean;
  onToggleShow: () => void;
  hint?: string;
  error?: string;
} & ComponentProps<'input'>;

function PasswordField({
  id,
  label,
  autoComplete,
  show,
  onToggleShow,
  hint,
  error,
  className,
  ...inputProps
}: PasswordFieldProps) {
  return (
    <div>
      <Label htmlFor={id} className="text-foreground mb-1.5 block text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={cn(error && 'border-destructive', 'pr-10', className)}
          {...inputProps}
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && !error ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      {error ? <p className="text-destructive mt-1 text-xs">{error}</p> : null}
    </div>
  );
}
