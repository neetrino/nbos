'use client';

import Link from 'next/link';
import { Building2, UserCircle2 } from 'lucide-react';

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

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage organization and workspace settings.
        </p>
      </div>

      <div className="bg-card border-border flex flex-wrap items-center gap-2 rounded-xl border p-3">
        <Link
          href="/my-account"
          className="hover:bg-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <UserCircle2 size={16} />
          <span>My Account</span>
        </Link>
        <span className="text-muted-foreground text-xs">
          Personal profile, security, and notifications moved here for all users.
        </span>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-6 flex items-center gap-2">
          <Building2 size={18} className="text-muted-foreground" />
          <h2 className="text-foreground text-base font-semibold">Company</h2>
        </div>
        <CompanyTab />
      </div>
    </div>
  );
}
