'use client';

import { Mail, Phone, Calendar, Building2, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Employee } from '@/lib/api/employees';
import { getEmployeeLevel, getEmployeeStatus } from '@/features/hr/constants/hr';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index]!;
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() ?? '';
  const last = lastName?.charAt(0)?.toUpperCase() ?? '';
  return first + last || '?';
}

const DEPT_ROLE_LABELS: Record<string, string> = {
  HEAD: 'Head',
  DEPUTY: 'Deputy',
  MEMBER: 'Member',
};

interface EmployeeSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeSheet({ employee, open, onOpenChange }: EmployeeSheetProps) {
  if (!employee) return null;

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  const initials = getInitials(employee.firstName, employee.lastName);
  const avatarColor = getAvatarColor(fullName);
  const levelInfo = getEmployeeLevel(employee.level ?? '');
  const statusInfo = getEmployeeStatus(employee.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-border shrink-0 border-b px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${avatarColor}`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-semibold">{fullName}</SheetTitle>
              {employee.position && (
                <p className="text-muted-foreground mt-0.5 text-sm">{employee.position}</p>
              )}
              <p className="text-muted-foreground text-sm">{employee.role.name}</p>
              {statusInfo && (
                <div className="mt-2">
                  <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
                </div>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
          <div className="border-border shrink-0 border-b px-6">
            <TabsList variant="default" className="h-9 w-full justify-start">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-6 py-4">
              <TabsContent value="general" className="mt-0">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="text-muted-foreground size-4 shrink-0" />
                      <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                        {employee.email}
                      </a>
                    </div>
                    {employee.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="text-muted-foreground size-4 shrink-0" />
                        <a href={`tel:${employee.phone}`} className="text-primary hover:underline">
                          {employee.phone}
                        </a>
                      </div>
                    )}
                    {employee.telegram && (
                      <div className="flex items-center gap-3 text-sm">
                        <Send className="text-muted-foreground size-4 shrink-0" />
                        <a
                          href={`https://t.me/${employee.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          @{employee.telegram.replace('@', '')}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {levelInfo && <Badge variant="secondary">{levelInfo.label}</Badge>}
                    {employee.hireDate && (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Calendar className="size-4" />
                        <span>Hired {new Date(employee.hireDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {employee.notes && (
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        Notes
                      </p>
                      <p className="text-foreground text-sm leading-relaxed">{employee.notes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="departments" className="mt-0">
                {employee.departments.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No departments assigned
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {employee.departments.map((ed) => (
                      <li
                        key={ed.id}
                        className="border-border bg-muted/30 flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Building2 className="text-muted-foreground size-4 shrink-0" />
                          <div>
                            <p className="font-medium">{ed.department.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {DEPT_ROLE_LABELS[ed.deptRole] ?? ed.deptRole}
                              </Badge>
                              {ed.isPrimary && (
                                <Badge variant="secondary" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
