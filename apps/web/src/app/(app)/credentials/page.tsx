'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Globe,
  Server,
  Settings,
  Smartphone,
  Mail,
  KeyRound,
  Database,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

type CredentialCategory =
  | 'ADMIN'
  | 'DOMAIN'
  | 'HOSTING'
  | 'SERVICE'
  | 'APP'
  | 'MAIL'
  | 'API_KEY'
  | 'DATABASE';

type AccessLevel = 'SECRET' | 'PROJECT_TEAM' | 'DEPARTMENT' | 'ALL';

interface Credential {
  id: string;
  name: string;
  category: CredentialCategory;
  provider: string;
  url: string;
  login: string;
  password: string;
  apiKey: string;
  envData: string;
  accessLevel: AccessLevel;
  projectId: string | null;
  updatedAt: string;
}

const CATEGORY_CONFIG: Record<
  CredentialCategory,
  { label: string; icon: typeof ShieldCheck; className: string }
> = {
  ADMIN: { label: 'Admin', icon: ShieldCheck, className: 'bg-violet-500/10 text-violet-600' },
  DOMAIN: { label: 'Domain', icon: Globe, className: 'bg-sky-500/10 text-sky-600' },
  HOSTING: { label: 'Hosting', icon: Server, className: 'bg-emerald-500/10 text-emerald-600' },
  SERVICE: { label: 'Service', icon: Settings, className: 'bg-amber-500/10 text-amber-600' },
  APP: { label: 'App', icon: Smartphone, className: 'bg-pink-500/10 text-pink-600' },
  MAIL: { label: 'Mail', icon: Mail, className: 'bg-indigo-500/10 text-indigo-600' },
  API_KEY: { label: 'API Key', icon: KeyRound, className: 'bg-orange-500/10 text-orange-600' },
  DATABASE: { label: 'Database', icon: Database, className: 'bg-teal-500/10 text-teal-600' },
};

const ACCESS_LEVEL_CONFIG: Record<AccessLevel, { label: string; className: string }> = {
  SECRET: { label: 'Secret', className: 'bg-red-500/10 text-red-600' },
  PROJECT_TEAM: { label: 'Team', className: 'bg-blue-500/10 text-blue-600' },
  DEPARTMENT: { label: 'Dept', className: 'bg-orange-500/10 text-orange-600' },
  ALL: { label: 'All', className: 'bg-emerald-500/10 text-emerald-600' },
};

const MOCK_CREDENTIALS: Credential[] = [
  {
    id: '1',
    name: 'Vercel Production',
    category: 'HOSTING',
    provider: 'Vercel',
    url: 'https://vercel.com',
    login: 'admin@company.am',
    password: 'xK9$mPw2!vL7',
    apiKey: 'vrcl_1a2b3c4d5e6f',
    envData: '',
    accessLevel: 'PROJECT_TEAM',
    projectId: 'NBOS Platform',
    updatedAt: '2026-03-10T14:30:00Z',
  },
  {
    id: '2',
    name: 'Neon Database — Prod',
    category: 'DATABASE',
    provider: 'Neon',
    url: 'https://console.neon.tech',
    login: 'db_admin',
    password: 'nN8#qRz5@wT3',
    apiKey: '',
    envData: 'DATABASE_URL=postgres://...\nDIRECT_URL=postgres://...',
    accessLevel: 'SECRET',
    projectId: 'NBOS Platform',
    updatedAt: '2026-03-09T10:15:00Z',
  },
  {
    id: '3',
    name: 'Cloudflare R2',
    category: 'SERVICE',
    provider: 'Cloudflare',
    url: 'https://dash.cloudflare.com',
    login: 'ops@company.am',
    password: 'cF4$bNm8!pQ1',
    apiKey: 'cf_r2_9z8y7x6w5v',
    envData: 'R2_ACCOUNT_ID=abc123\nR2_ACCESS_KEY=...',
    accessLevel: 'SECRET',
    projectId: null,
    updatedAt: '2026-03-08T09:00:00Z',
  },
  {
    id: '4',
    name: 'Google Workspace',
    category: 'ADMIN',
    provider: 'Google',
    url: 'https://admin.google.com',
    login: 'admin@company.am',
    password: 'gW2!kLp9$mX4',
    apiKey: '',
    envData: '',
    accessLevel: 'SECRET',
    projectId: null,
    updatedAt: '2026-03-07T16:45:00Z',
  },
  {
    id: '5',
    name: 'company.am',
    category: 'DOMAIN',
    provider: 'Porkbun',
    url: 'https://porkbun.com',
    login: 'domains@company.am',
    password: 'pB7#rTz3!vN6',
    apiKey: '',
    envData: '',
    accessLevel: 'DEPARTMENT',
    projectId: null,
    updatedAt: '2026-03-06T11:20:00Z',
  },
  {
    id: '6',
    name: 'Resend Email',
    category: 'MAIL',
    provider: 'Resend',
    url: 'https://resend.com',
    login: 'dev@company.am',
    password: 'rS5!hWk8$mQ2',
    apiKey: 're_1234567890abcdef',
    envData: 'RESEND_API_KEY=re_...',
    accessLevel: 'PROJECT_TEAM',
    projectId: 'NBOS Platform',
    updatedAt: '2026-03-05T08:30:00Z',
  },
  {
    id: '7',
    name: 'Stripe Live',
    category: 'API_KEY',
    provider: 'Stripe',
    url: 'https://dashboard.stripe.com',
    login: 'finance@company.am',
    password: 'sT9$bNk2!pL7',
    apiKey: 'sk_live_abcdef123456',
    envData: 'STRIPE_SECRET_KEY=sk_live_...\nSTRIPE_WEBHOOK_SECRET=whsec_...',
    accessLevel: 'SECRET',
    projectId: 'Client Portal',
    updatedAt: '2026-03-04T13:10:00Z',
  },
  {
    id: '8',
    name: 'Firebase (Mobile)',
    category: 'APP',
    provider: 'Google Firebase',
    url: 'https://console.firebase.google.com',
    login: 'mobile@company.am',
    password: 'fB3!mXp7$kN9',
    apiKey: 'AIzaSyAbCdEfGhIjKlMn',
    envData: '',
    accessLevel: 'PROJECT_TEAM',
    projectId: 'Client Portal',
    updatedAt: '2026-03-03T17:55:00Z',
  },
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MaskedField({ value, label }: { value: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-14 shrink-0 text-[10px]">{label}</span>
      <span className="text-foreground font-mono text-xs">{visible ? value : '••••••••••••'}</span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground p-0.5"
      >
        {visible ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground p-0.5">
        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function CredentialRow({ credential }: { credential: Credential }) {
  const [expanded, setExpanded] = useState(false);
  const catCfg = CATEGORY_CONFIG[credential.category];
  const accCfg = ACCESS_LEVEL_CONFIG[credential.accessLevel];
  const CatIcon = catCfg.icon;

  return (
    <div className="border-border bg-card rounded-xl border transition-all hover:shadow-sm">
      <div
        className="flex cursor-pointer items-center gap-4 px-5 py-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={`rounded-lg p-2 ${catCfg.className}`}>
          <CatIcon size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground truncate text-sm font-medium">{credential.name}</h3>
            {credential.url && (
              <a
                href={credential.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{credential.provider}</p>
        </div>

        <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${catCfg.className}`}>
          {catCfg.label}
        </span>

        <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${accCfg.className}`}>
          {accCfg.label}
        </span>

        {credential.projectId ? (
          <span className="bg-secondary text-muted-foreground w-28 truncate rounded-md px-2 py-0.5 text-center text-[10px] font-medium">
            {credential.projectId}
          </span>
        ) : (
          <span className="text-muted-foreground w-28 text-center text-[10px]">—</span>
        )}

        <span className="text-muted-foreground w-20 text-right text-[10px]">
          {formatRelativeTime(credential.updatedAt)}
        </span>

        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {expanded && (
        <div className="border-border space-y-2 border-t px-5 py-4">
          {credential.login && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-14 shrink-0 text-[10px]">Login</span>
              <span className="text-foreground font-mono text-xs">{credential.login}</span>
            </div>
          )}
          <MaskedField value={credential.password} label="Pass" />
          <MaskedField value={credential.apiKey} label="API Key" />
          {credential.envData && (
            <div className="mt-2">
              <span className="text-muted-foreground text-[10px]">ENV Data</span>
              <pre className="bg-secondary mt-1 overflow-x-auto rounded-lg p-3 font-mono text-xs">
                {credential.envData}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateCredentialModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border-border w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Add Credential</h2>
          <button
            onClick={onClose}
            className="hover:bg-secondary rounded-lg p-1.5 transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">Name</label>
            <input
              type="text"
              placeholder="e.g. Vercel Production"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Category</label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">
                Access Level
              </label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                {Object.entries(ACCESS_LEVEL_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">Provider</label>
            <input
              type="text"
              placeholder="e.g. Vercel, AWS, Google"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">URL</label>
            <input
              type="url"
              placeholder="https://..."
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Login</label>
              <input
                type="text"
                placeholder="Username or email"
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">API Key</label>
            <input
              type="password"
              placeholder="sk_live_..."
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">
              ENV Data
              <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="KEY=value&#10;ANOTHER_KEY=value"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-xl border px-3 py-2.5 font-mono text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">
              Project
              <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Link to a project"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Save Credential
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CredentialsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CredentialCategory | 'ALL'>('ALL');
  const [accessFilter, setAccessFilter] = useState<AccessLevel | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = MOCK_CREDENTIALS.filter((cred) => {
    const matchesSearch =
      !search ||
      cred.name.toLowerCase().includes(search.toLowerCase()) ||
      cred.provider.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || cred.category === categoryFilter;
    const matchesAccess = accessFilter === 'ALL' || cred.accessLevel === accessFilter;
    return matchesSearch && matchesCategory && matchesAccess;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Credentials Vault</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {filtered.length} credential{filtered.length !== 1 ? 's' : ''} stored
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Credential
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search credentials..."
            className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CredentialCategory | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as AccessLevel | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Access Levels</option>
            {Object.entries(ACCESS_LEVEL_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed py-20 text-center">
          <KeyRound size={48} className="text-muted-foreground/30 mx-auto" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">No credentials found</h3>
          <p className="text-muted-foreground mt-1 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-muted-foreground hidden items-center gap-4 px-5 text-[10px] font-medium tracking-wider uppercase md:flex">
            <span className="w-8" />
            <span className="min-w-0 flex-1">Name / Provider</span>
            <span className="w-16 text-center">Category</span>
            <span className="w-16 text-center">Access</span>
            <span className="w-28 text-center">Project</span>
            <span className="w-20 text-right">Updated</span>
            <span className="w-3.5" />
          </div>
          {filtered.map((cred) => (
            <CredentialRow key={cred.id} credential={cred} />
          ))}
        </div>
      )}

      {showCreate && <CreateCredentialModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
