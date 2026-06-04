import { cn } from '@/lib/utils';

export interface PlatformIconProps {
  className?: string;
}

export function ApplePlatformIcon({ className }: PlatformIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn('size-4 shrink-0', className)}
      fill="currentColor"
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.94 7.6 9.18 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.66 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function GooglePlayPlatformIcon({ className }: PlatformIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn('size-4 shrink-0', className)}
      fill="currentColor"
    >
      <path d="M3.609 1.814 13.792 12 3.61 22.186a1.004 1.004 0 0 1-.61-.92V2.734a1.004 1.004 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198 2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658 16.8 9.99l-2.302 2.302-8.634-8.634z" />
    </svg>
  );
}
