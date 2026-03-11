import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <SignUp afterSignUpUrl="/dashboard" />
    </div>
  );
}
