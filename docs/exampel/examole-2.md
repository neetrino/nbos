You are given a task to integrate an existing React component in the codebase

The codebase should support:

- shadcn project structure
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles.
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:

```tsx
card.tsx;
import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming you have a lib/utils.ts for cn

// --- PROPS INTERFACE ---
// Defines the shape of data required by the component for type safety and clarity.
export interface AnalyticsCardProps {
  title: string;
  totalAmount: string;
  icon: React.ReactNode;
  data: {
    label: string;
    value: number;
  }[];
  className?: string;
}

/**
 * A responsive and theme-adaptive card for displaying analytics with an animated bar chart.
 * Built with TypeScript, Tailwind CSS, and Framer Motion.
 */
export const AnalyticsCard = ({
  title,
  totalAmount,
  icon,
  data = [],
  className,
}: AnalyticsCardProps) => {
  // Find the maximum value in the dataset to apply a distinct style.
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <div
      className={cn(
        'bg-card text-card-foreground w-full max-w-sm rounded-2xl border p-6 shadow-sm',
        className,
      )}
    >
      {/* --- CARD HEADER --- */}
      <div className="flex items-start justify-between">
        <h3 className="text-muted-foreground text-lg font-medium">{title}</h3>
        <div className="bg-muted/50 flex h-8 w-8 items-center justify-center rounded-full">
          {icon}
        </div>
      </div>

      {/* --- MAIN VALUE --- */}
      <div className="my-4">
        <h2 className="text-4xl font-bold tracking-tight">{totalAmount}</h2>
      </div>

      {/* --- ANIMATED BAR CHART --- */}
      <div className="grid grid-cols-3 gap-4" aria-label="Weekly analytics chart">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            {/* Bar container with striped background */}
            <div
              className="bg-muted/60 relative flex h-32 w-full items-end overflow-hidden rounded-lg"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 4px, hsl(var(--muted)) 4px, hsl(var(--muted)) 8px)',
                backgroundSize: '16px 16px',
              }}
              role="presentation"
            >
              {/* Animated bar */}
              <motion.div
                className={cn(
                  'relative w-full rounded-t-md p-2',
                  // Highlight the bar with the maximum value
                  item.value === maxValue ? 'bg-primary' : 'bg-primary/40',
                )}
                initial={{ height: '0%' }}
                animate={{ height: `${item.value}%` }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1], // Expo ease-out
                }}
                aria-label={`${item.label}: ${item.value}%`}
                aria-valuenow={item.value}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {/* Top handle and percentage text */}
                <div className="bg-background/50 absolute top-1.5 left-1/2 h-1 w-1/3 -translate-x-1/2 rounded-full" />
                <span className="text-primary-foreground absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold">
                  {item.value}%
                </span>
              </motion.div>
            </div>
            {/* Label below the bar */}
            <span className="text-muted-foreground text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

demo.tsx;
import { AnalyticsCard } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react'; // Example icon from lucide-react

// --- DEMO COMPONENT ---
// Provides a clean, centered preview of the AnalyticsCard.
const AnalyticsCardDemo = () => {
  // Sample data to be passed into the component via props.
  const sampleAnalyticsData = [
    { label: 'Mon', value: 64 },
    { label: 'Tue', value: 52 },
    { label: 'Wed', value: 46 },
  ];

  return (
    <div className="bg-background flex h-screen w-full items-center justify-center p-4">
      <AnalyticsCard
        title="Analytics"
        totalAmount="$242,63"
        icon={<ArrowUpRight className="text-muted-foreground h-4 w-4" />}
        data={sampleAnalyticsData}
      />
    </div>
  );
};

export default AnalyticsCardDemo;
```

Install NPM dependencies:

```bash
framer-motion
```

Implementation Guidelines

1.  Analyze the component structure and identify all required dependencies
2.  Review the component's argumens and state
3.  Identify any required context providers or hooks and install them
4.  Questions to Ask

- What data/props will be passed to this component?
- Are there any specific state management requirements?
- Are there any required assets (images, icons, etc.)?
- What is the expected responsive behavior?
- What is the best place to use this component in the app?

Steps to integrate 0. Copy paste all the code above in the correct directories

1.  Install external dependencies
2.  Fill image assets with Unsplash stock images you know exist
3.  Use lucide-react icons for svgs or logos if component requires them
