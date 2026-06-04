import { cva } from 'class-variance-authority';

/** Icon badge tones — pair with {@link actionTileShellVariants} of the same tone. */
export const actionTileIconVariants = cva(
  'flex shrink-0 items-center justify-center rounded-lg transition-colors',
  {
    variants: {
      tone: {
        sky: 'bg-sky-500/10 text-sky-700 group-hover/action-tile:bg-sky-500/20 dark:text-sky-300',
        violet:
          'bg-violet-500/10 text-violet-700 group-hover/action-tile:bg-violet-500/20 dark:text-violet-300',
        primary: 'bg-primary/15 text-primary group-hover/action-tile:bg-primary/25',
        emerald:
          'bg-emerald-500/10 text-emerald-700 group-hover/action-tile:bg-emerald-500/20 dark:text-emerald-300',
        amber:
          'bg-amber-500/10 text-amber-700 group-hover/action-tile:bg-amber-500/20 dark:text-amber-300',
        secondary: 'bg-secondary text-secondary-foreground group-hover/action-tile:bg-secondary/80',
        muted: 'bg-muted text-muted-foreground group-hover/action-tile:bg-muted/80',
        neutral:
          'bg-muted/60 text-muted-foreground group-hover/action-tile:bg-muted group-hover/action-tile:text-foreground',
      },
      size: {
        sm: 'p-1 [&_svg]:size-3',
        md: 'p-1.5 [&_svg]:size-3.5',
        lg: 'p-2 [&_svg]:size-[18px]',
      },
    },
    defaultVariants: {
      tone: 'primary',
      size: 'md',
    },
  },
);

export const actionTileShellVariants = cva(
  [
    'group/action-tile inline-flex min-w-0 items-center border text-left font-medium transition-[color,background-color,border-color,box-shadow] duration-150',
    'focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-1 focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      tone: {
        sky: 'border-border bg-card hover:border-sky-300/60 hover:bg-sky-500/[0.06] dark:hover:border-sky-500/40',
        violet:
          'border-border bg-card hover:border-violet-300/60 hover:bg-violet-500/[0.06] dark:hover:border-violet-500/40',
        primary: 'border-border bg-card hover:border-primary/35 hover:bg-primary/[0.06]',
        emerald: 'border-border bg-card hover:border-emerald-300/60 hover:bg-emerald-500/[0.06]',
        amber: 'border-border bg-card hover:border-amber-300/60 hover:bg-amber-500/[0.06]',
        secondary: 'border-border bg-card hover:border-foreground/15 hover:bg-muted/50',
        muted: 'border-border bg-card hover:bg-muted/40',
        neutral: 'border-border bg-card hover:border-foreground/15 hover:bg-muted/40',
      },
      size: {
        sm: 'gap-1.5 rounded-lg px-2 py-1 text-xs',
        md: 'gap-2.5 rounded-xl px-3 py-2.5 text-sm',
        lg: 'gap-2.5 rounded-xl px-3 py-3 text-sm shadow-sm',
      },
    },
    defaultVariants: {
      tone: 'primary',
      size: 'md',
    },
  },
);

export type ActionTileTone = NonNullable<Parameters<typeof actionTileShellVariants>[0]>['tone'];
export type ActionTileSize = NonNullable<Parameters<typeof actionTileShellVariants>[0]>['size'];
