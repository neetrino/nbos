'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ReactElement } from 'react';

export interface ChartDatum {
  name: string;
  value: number;
  secondary?: number;
}

const CHART_COLORS = [
  'var(--primary)',
  'oklch(0.62 0.18 250)',
  'oklch(0.68 0.16 145)',
  'oklch(0.72 0.18 65)',
  'oklch(0.62 0.2 20)',
] as const;

export function ReportBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={formatChartValue} />
        <Tooltip cursor={{ fill: 'var(--muted)' }} formatter={formatTooltipValue} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--primary)" minPointSize={3}>
          <LabelList
            dataKey="value"
            position="top"
            formatter={formatChartValue}
            className="text-xs"
          />
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

export function ReportLineChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartFrame>
      <LineChart data={data} margin={{ top: 20, right: 10, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={formatChartValue} />
        <Tooltip formatter={formatTooltipValue} />
        <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot>
          <LabelList
            dataKey="value"
            position="top"
            formatter={formatChartValue}
            className="text-xs"
          />
        </Line>
      </LineChart>
    </ChartFrame>
  );
}

export function ReportAreaChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartFrame>
      <AreaChart data={data} margin={{ top: 20, right: 10, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={formatChartValue} />
        <Tooltip formatter={formatTooltipValue} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.16}
          strokeWidth={2.5}
        />
        <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={0} dot>
          <LabelList
            dataKey="value"
            position="top"
            formatter={formatChartValue}
            className="text-xs"
          />
        </Line>
      </AreaChart>
    </ChartFrame>
  );
}

export function ReportPieChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartFrame>
      <PieChart>
        <Tooltip formatter={formatTooltipValue} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={90}
          innerRadius={52}
          label={({ name, value }) => `${name}: ${formatChartValue(value)}`}
        >
          {data.map((item, index) => (
            <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartFrame>
  );
}

function ChartFrame({ children }: { children: ReactElement }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function formatChartValue(value: unknown): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: Math.abs(numeric) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(numeric);
}

function formatTooltipValue(value: unknown): [string, string] {
  return [formatChartValue(value), 'Value'];
}
