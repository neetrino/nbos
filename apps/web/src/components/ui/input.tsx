import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'border-border/60 bg-muted/20 text-foreground file:text-foreground placeholder:text-muted-foreground hover:border-border hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-muted/15 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:border-border/50 dark:bg-input/35 dark:hover:bg-input/45 dark:disabled:bg-input/25 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-base shadow-sm shadow-black/[0.04] transition-[border-color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
