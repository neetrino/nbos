import { MyAccountContent } from '@/components/account/MyAccountContent';

export default function MyAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">My Account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Profile, wallet, security, and notification preferences.
        </p>
      </div>
      <MyAccountContent />
    </div>
  );
}
