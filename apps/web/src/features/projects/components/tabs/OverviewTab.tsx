'use client';

import { FileText, Ticket, KeyRound, DollarSign, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { getProjectType } from '../../constants/projects';
import type { FullProject } from '@/lib/api/projects';

interface OverviewTabProps {
  project: FullProject;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function OverviewTab({ project }: OverviewTabProps) {
  const projType = getProjectType(project.type);
  const openTickets = project.tickets.filter(
    (t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED',
  ).length;
  const totalRevenue = project.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Orders"
          value={project._count.orders}
          color="bg-emerald-500"
        />
        <StatCard icon={Ticket} label="Open Tickets" value={openTickets} color="bg-amber-500" />
        <StatCard
          icon={KeyRound}
          label="Credentials"
          value={project._count.credentials}
          color="bg-red-500"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`${(totalRevenue / 1000).toFixed(0)}K`}
          color="bg-teal-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-card border-border rounded-xl border p-5">
          <h3 className="mb-4 text-sm font-semibold">Project Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              {projType && <StatusBadge label={projType.label} variant={projType.variant} />}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact</span>
              <span className="font-medium">
                {project.contact?.firstName} {project.contact?.lastName}
              </span>
            </div>
            {project.company && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{project.company.name}</span>
              </div>
            )}
            {project.seller && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seller</span>
                <span className="font-medium">
                  {project.seller.firstName} {project.seller.lastName}
                </span>
              </div>
            )}
            {project.pm && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">PM</span>
                <span className="font-medium">
                  {project.pm.firstName} {project.pm.lastName}
                </span>
              </div>
            )}
            {project.deadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium">
                  {new Date(project.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>

        {project.description && (
          <section className="bg-card border-border rounded-xl border p-5">
            <h3 className="mb-2 text-sm font-semibold">Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
          </section>
        )}
      </div>

      {project.auditLogs.length > 0 && (
        <section className="bg-card border-border rounded-xl border p-5">
          <h3 className="mb-4 text-sm font-semibold">Recent Activity</h3>
          <div className="space-y-3">
            {project.auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <Clock size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{log.action}</span>{' '}
                  <span className="text-muted-foreground">on {log.entityType}</span>
                  <p className="text-muted-foreground text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
