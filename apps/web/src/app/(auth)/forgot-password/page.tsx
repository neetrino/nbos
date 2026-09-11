'use client';

import { useRouter } from 'next/navigation';
import { AuthScene } from '@/components/auth/AuthScene';
import { ForgotPasswordForm } from '@/features/account/components/forgot-password-form';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <AuthScene
      eyebrow="Recover access"
      title="Forgot password"
      description="Enter your work email and we will send a reset link."
    >
      <ForgotPasswordForm onBack={() => router.push('/sign-in')} />
    </AuthScene>
  );
}
