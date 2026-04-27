'use client';

import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, UserCircle2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { usePermission } from '@/lib/permissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Topbar() {
  const router = useRouter();
  const { me } = usePermission();
  const displayName =
    me?.firstName && me?.lastName
      ? `${me.firstName} ${me.lastName}`
      : (me?.firstName ?? me?.email ?? 'My Account');
  const initials = me?.firstName?.[0] ?? me?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header className="border-border bg-card/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-sm">
      {/* Page title area */}
      <div className="flex items-center gap-4">
        <h1 className="text-foreground text-lg font-semibold">Dashboard</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="text-muted-foreground hover:bg-secondary hover:text-foreground relative rounded-lg p-2 transition-colors">
          <Bell size={20} />
          <span className="bg-accent absolute top-1.5 right-1.5 h-2 w-2 rounded-full" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-secondary flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors">
            <span className="bg-secondary text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
              {initials}
            </span>
            <span className="text-foreground hidden max-w-[160px] truncate text-sm font-medium md:inline">
              {displayName}
            </span>
            <ChevronDown size={16} className="text-muted-foreground hidden md:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push('/my-account')}>
              <UserCircle2 size={16} />
              <span>My Account</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
