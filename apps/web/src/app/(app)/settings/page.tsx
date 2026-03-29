'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Building2, Bell, Shield, Camera, Smartphone, Monitor } from 'lucide-react';
import { api } from '@/lib/api';
import { usePermission } from '@/lib/permissions';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type TabId = 'profile' | 'company' | 'notifications' | 'security';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  telegram: string | null;
  avatar: string | null;
  birthday: string | null;
  position: string | null;
  role: { name: string; slug: string } | null;
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-foreground mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        disabled={disabled}
        className="border-border bg-secondary/30 text-foreground w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E5A84B]/40 disabled:opacity-50"
      />
    </div>
  );
}

function Toggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? 'bg-[#E5A84B]' : 'bg-secondary'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function ProfileTab() {
  const { me } = usePermission();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [birthday, setBirthday] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ProfileData>('/api/me');
      const data = res.data;
      setProfile(data);
      setFirstName(data.firstName ?? '');
      setLastName(data.lastName ?? '');
      setPhone(data.phone ?? '');
      setTelegram(data.telegram ?? '');
      setBirthday(data.birthday ? data.birthday.slice(0, 10) : '');
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/me/profile', {
        phone: phone || undefined,
        telegram: telegram || undefined,
        birthday: birthday || null,
      });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-muted-foreground text-sm">Could not load profile data.</div>;
  }

  const initials =
    (profile.firstName?.[0] ?? '') + (profile.lastName?.[0] ?? '') ||
    profile.email?.[0]?.toUpperCase() ||
    '?';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="bg-secondary text-muted-foreground flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-semibold">
            {initials}
          </div>
          <button className="absolute -right-1 -bottom-1 rounded-lg bg-[#E5A84B] p-1.5 text-white shadow">
            <Camera size={12} />
          </button>
        </div>
        <div>
          <p className="text-foreground text-lg font-semibold">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="text-muted-foreground text-sm">{profile.role?.name ?? 'No role'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="First Name" value={firstName} disabled />
        <InputField label="Last Name" value={lastName} disabled />
        <InputField label="Email" value={profile.email} type="email" disabled />
        <InputField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <InputField label="Telegram" value={telegram} onChange={setTelegram} />
        <InputField label="Birthday" value={birthday} onChange={setBirthday} type="date" />
      </div>

      <div>
        <label className="text-foreground mb-1.5 block text-sm font-medium">Role</label>
        <div className="border-border bg-secondary/30 text-foreground w-full rounded-xl border px-4 py-2.5 text-sm sm:max-w-xs">
          {profile.role?.name ?? '—'}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function CompanyTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Company Name" value="NBOS LLC" />
        <InputField label="Tax ID" value="02612345" />
        <div className="sm:col-span-2">
          <InputField label="Address" value="Yerevan, Armenia, Tumanyan 8" />
        </div>
        <InputField label="Country" value="Armenia" />
        <InputField label="City" value="Yerevan" />
      </div>
      <button className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-90">
        Save Changes
      </button>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-1">
      <h3 className="text-foreground mb-3 font-medium">Email Notifications</h3>
      <Toggle
        label="Invoice reminders"
        description="Get notified about upcoming invoice deadlines"
        defaultChecked
      />
      <Toggle
        label="Payment received"
        description="Notify when a payment is processed"
        defaultChecked
      />
      <Toggle
        label="New lead assigned"
        description="Get notified when a new lead is assigned to you"
      />
      <Toggle
        label="Weekly report"
        description="Receive a weekly summary every Monday"
        defaultChecked
      />

      <h3 className="text-foreground mt-6 mb-3 font-medium">In-App Notifications</h3>
      <Toggle
        label="Task updates"
        description="When tasks assigned to you change status"
        defaultChecked
      />
      <Toggle label="Comments & mentions" description="When someone mentions you" defaultChecked />
      <Toggle
        label="System alerts"
        description="Maintenance and downtime notifications"
        defaultChecked
      />
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-foreground font-medium">Change Password</h3>
        <p className="text-muted-foreground text-sm">
          Password management is handled through the NBOS authentication system. Contact your
          administrator if you need a password reset flow enabled.
        </p>
      </div>

      <div className="border-border border-t pt-6">
        <Toggle
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
        />
      </div>

      <div className="border-border border-t pt-6">
        <h3 className="text-foreground font-medium">Active Sessions</h3>
        <div className="mt-4 space-y-3">
          <SessionRow icon={Monitor} device="Current browser" time="Current session" current />
        </div>
      </div>
    </div>
  );
}

function SessionRow({
  icon: Icon,
  device,
  time,
  current = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  device: string;
  time: string;
  current?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-muted-foreground" />
        <div>
          <p className="text-foreground text-sm">{device}</p>
          <p className="text-muted-foreground text-xs">{time}</p>
        </div>
      </div>
      {current ? (
        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
          Active
        </span>
      ) : (
        <button className="text-muted-foreground text-xs hover:text-red-500">Revoke</button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account and application preferences.
        </p>
      </div>

      <div className="border-border flex items-center gap-1 border-b pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'company' && <CompanyTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}
