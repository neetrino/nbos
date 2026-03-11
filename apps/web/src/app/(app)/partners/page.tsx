'use client';

import { useState } from 'react';
import { Search, Plus, User, Phone, Mail, Percent, Link2 } from 'lucide-react';

/* ───────── Types ───────── */

interface Partner {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  payoutPercent: number;
  subscriptionsCount: number;
}

/* ───────── Mock data ───────── */

const PARTNERS: Partner[] = [
  {
    id: '1',
    name: 'CloudHost Armenia',
    contactPerson: 'Armen Petrosyan',
    phone: '+374 91 123456',
    email: 'armen@cloudhost.am',
    payoutPercent: 30,
    subscriptionsCount: 12,
  },
  {
    id: '2',
    name: 'WebDev Studio',
    contactPerson: 'Lilit Hakobyan',
    phone: '+374 93 654321',
    email: 'lilit@webdev.studio',
    payoutPercent: 25,
    subscriptionsCount: 8,
  },
  {
    id: '3',
    name: 'DigiMarketing AM',
    contactPerson: 'Tigran Sargsyan',
    phone: '+374 99 112233',
    email: 'tigran@digimarketing.am',
    payoutPercent: 35,
    subscriptionsCount: 5,
  },
  {
    id: '4',
    name: 'TechSupport Pro',
    contactPerson: 'Anna Grigoryan',
    phone: '+374 77 998877',
    email: 'anna@techsupport.pro',
    payoutPercent: 20,
    subscriptionsCount: 15,
  },
  {
    id: '5',
    name: 'DesignLab',
    contactPerson: null,
    phone: '+374 55 445566',
    email: 'info@designlab.am',
    payoutPercent: 40,
    subscriptionsCount: 3,
  },
  {
    id: '6',
    name: 'ServerAM',
    contactPerson: 'Gevorg Avetisyan',
    phone: null,
    email: 'gevorg@serveram.com',
    payoutPercent: 30,
    subscriptionsCount: 20,
  },
];

/* ───────── Helpers ───────── */

function payoutBadgeColor(pct: number): string {
  if (pct >= 35) return 'bg-emerald-100 text-emerald-700';
  if (pct >= 25) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

/* ───────── Components ───────── */

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <h3 className="text-foreground text-lg font-semibold">{partner.name}</h3>
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${payoutBadgeColor(partner.payoutPercent)}`}
        >
          <Percent size={12} className="mr-0.5 inline" />
          {partner.payoutPercent}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {partner.contactPerson && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <User size={14} className="shrink-0" />
            <span>{partner.contactPerson}</span>
          </div>
        )}
        {partner.phone && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Phone size={14} className="shrink-0" />
            <span>{partner.phone}</span>
          </div>
        )}
        {partner.email && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Mail size={14} className="shrink-0" />
            <span>{partner.email}</span>
          </div>
        )}
      </div>

      <div className="border-border mt-4 flex items-center gap-2 border-t pt-3">
        <Link2 size={14} className="text-muted-foreground" />
        <span className="text-muted-foreground text-sm">
          {partner.subscriptionsCount} subscription
          {partner.subscriptionsCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

/* ───────── Page ───────── */

export default function PartnersPage() {
  const [search, setSearch] = useState('');

  const filtered = PARTNERS.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.contactPerson?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Partners</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage partner companies and payout terms.
          </p>
        </div>
        <button className="bg-primary text-primary-foreground flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90">
          <Plus size={16} />
          Add Partner
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search
          size={16}
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="text"
          placeholder="Search partners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-border bg-card text-foreground placeholder:text-muted-foreground w-full rounded-xl border py-2.5 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-[#E5A84B]/40"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <PartnerCard key={p.id} partner={p} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full py-12 text-center text-sm">
            No partners found.
          </p>
        )}
      </div>
    </div>
  );
}
