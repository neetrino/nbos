'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { signOutClient } from '@/lib/auth/session-sign-out';
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
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
} from '@/features/account/constants/account-password-policy';

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ChangePasswordPanel({ accountEmail }: { accountEmail?: string }) {
  const t = useTranslations('account.password');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t('currentRequired')),
          newPassword: z
            .string()
            .min(ACCOUNT_PASSWORD_MIN_LENGTH, t('minLength', { min: ACCOUNT_PASSWORD_MIN_LENGTH }))
            .max(ACCOUNT_PASSWORD_MAX_LENGTH)
            .regex(ACCOUNT_PASSWORD_COMPLEXITY, t('complexity')),
          confirmPassword: z.string().min(1, t('confirmRequired')),
        })
        .refine((values) => values.newPassword === values.confirmPassword, {
          message: t('mismatch'),
          path: ['confirmPassword'],
        })
        .refine((values) => values.newPassword !== values.currentPassword, {
          message: t('mustDiffer'),
          path: ['newPassword'],
        }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(schema),
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
      toast.success(t('updated'));
      await signOutClient();
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, t('changeFailed')));
    }
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-start gap-3">
        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <KeyRound className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{t('title')}</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{t('description')}</p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
      >
        <PasswordField
          id="current-password"
          label={t('current')}
          hideLabel={t('hide')}
          showLabel={t('show')}
          autoComplete="current-password"
          show={showCurrent}
          onToggleShow={() => setShowCurrent((value) => !value)}
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordField
          id="new-password"
          label={t('new')}
          hideLabel={t('hide')}
          showLabel={t('show')}
          autoComplete="new-password"
          show={showNew}
          onToggleShow={() => setShowNew((value) => !value)}
          hint={t('hint', { min: ACCOUNT_PASSWORD_MIN_LENGTH })}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField
          id="confirm-password"
          label={t('confirm')}
          hideLabel={t('hide')}
          showLabel={t('show')}
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
            {t('forgot')}
          </button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('updating') : t('update')}
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
  const t = useTranslations('account.password');
  const tCommon = useTranslations('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent forceNestedBackdrop className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('forgotTitle')}</DialogTitle>
          <DialogDescription>{t('forgotDescription')}</DialogDescription>
        </DialogHeader>
        <ForgotPasswordForm
          defaultEmail={accountEmail}
          backLabel={tCommon('close')}
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
  hideLabel: string;
  showLabel: string;
  hint?: string;
  error?: string;
} & ComponentProps<'input'>;

function PasswordField({
  id,
  label,
  autoComplete,
  show,
  onToggleShow,
  hideLabel,
  showLabel,
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
          aria-label={show ? hideLabel : showLabel}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && !error ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      {error ? <p className="text-destructive mt-1 text-xs">{error}</p> : null}
    </div>
  );
}
