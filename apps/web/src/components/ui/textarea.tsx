import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          'border-border/60 bg-muted/20 text-foreground placeholder:text-muted-foreground hover:border-border hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-muted/15 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:border-border/50 dark:bg-input/35 dark:hover:bg-input/45 dark:disabled:bg-input/25 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-[5.5rem] w-full rounded-xl border px-3 py-2.5 text-base shadow-sm shadow-black/[0.04] transition-[border-color,box-shadow,background-color] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
