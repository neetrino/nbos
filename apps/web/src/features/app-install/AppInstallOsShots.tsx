import type { ReactNode } from 'react';

const SHARE_MARK_SIZE_PX = 14;

export function AndroidInstallShot({ badge }: { badge: string }) {
  return (
    <OsShotFrame src="/icons/splash.png">
      <div className="bg-background/95 absolute inset-x-1.5 top-1.5 flex items-center justify-between rounded-md px-1.5 py-1">
        <span className="text-muted-foreground truncate text-[8px]">nbos…</span>
        <span className="text-foreground text-xs leading-none font-bold">⋮</span>
      </div>
      <div className="bg-background border-border absolute top-8 right-1.5 w-[6.25rem] rounded-lg border p-1 shadow-sm">
        <p className="text-muted-foreground px-1.5 py-1 text-[8px]">⋯</p>
        <p className="bg-primary/10 text-primary rounded-md px-1.5 py-1 text-[9px] leading-3 font-semibold">
          {badge}
        </p>
      </div>
    </OsShotFrame>
  );
}

export function IosInstallShot({ badge }: { badge: string }) {
  return (
    <OsShotFrame src="/icons/logo.png" cover={false}>
      <div className="text-foreground absolute top-1.5 right-2">
        <IosShareMark />
      </div>
      <div className="bg-background/95 border-border absolute inset-x-1.5 bottom-1.5 rounded-lg border px-1.5 py-1.5">
        <p className="text-foreground text-center text-[9px] leading-3 font-semibold">{badge}</p>
      </div>
    </OsShotFrame>
  );
}

function OsShotFrame({
  src,
  cover = true,
  children,
}: {
  src: string;
  cover?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="border-border bg-muted/30 relative h-32 overflow-hidden rounded-xl border"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local icon preview; no next/image localPatterns */}
      <img
        src={src}
        alt=""
        className={
          cover
            ? 'absolute inset-0 size-full object-cover'
            : 'absolute top-7 left-1/2 size-11 -translate-x-1/2 rounded-xl object-cover'
        }
      />
      <div className="bg-background/25 absolute inset-0" />
      {children}
    </div>
  );
}

function IosShareMark() {
  return (
    <svg width={SHARE_MARK_SIZE_PX} height={SHARE_MARK_SIZE_PX} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v11M8 7l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 13v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
