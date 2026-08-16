'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm({
  defaultEmail = '',
  onBack,
  backLabel = 'Back to sign in',
  className,
}: {
  defaultEmail?: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const result = await authApi.forgotPassword(values.email);
      setSentMessage(result.message);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Could not send a reset link.'));
    }
  }

  if (sentMessage) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="bg-accent/10 rounded-xl p-4">
          <Mail className="text-accent mb-2 size-5" aria-hidden />
          <p className="text-foreground text-sm font-medium">Check your email</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{sentMessage}</p>
        </div>
        {onBack ? (
          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            {backLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className={cn('space-y-4', className)}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <div>
        <Label htmlFor="forgot-email" className="text-foreground mb-1.5 block text-sm font-medium">
          Email
        </Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@company.com"
          className={cn(errors.email && 'border-destructive')}
          {...register('email')}
        />
        {errors.email ? (
          <p className="text-destructive mt-1 text-xs">{errors.email.message}</p>
        ) : null}
      </div>

      {formError ? <p className="text-destructive text-xs">{formError}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </Button>

      {onBack ? (
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          {backLabel}
        </Button>
      ) : null}
    </form>
  );
}
