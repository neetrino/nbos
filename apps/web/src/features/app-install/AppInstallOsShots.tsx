export function AndroidInstallShot({ badge }: { badge: string }) {
  return (
    <div className="border-border bg-muted/40 relative h-28 overflow-hidden rounded-xl border">
      {/* eslint-disable-next-line @next/next/no-img-element -- local splash preview; no next/image localPatterns */}
      <img src="/icons/splash.png" alt="" className="absolute inset-0 size-full object-cover" />
      <div className="bg-background/95 absolute inset-x-1.5 top-1.5 flex items-center justify-between rounded-md px-1.5 py-1">
        <span className="text-muted-foreground truncate text-[8px]">nbos…</span>
        <span className="text-foreground text-[11px] leading-none font-bold">⋮</span>
      </div>
      <div className="bg-background/95 border-border absolute top-8 right-1.5 w-[4.5rem] rounded-md border p-1 shadow-sm">
        <p className="text-muted-foreground px-1 py-0.5 text-[8px]">⋯</p>
        <p className="bg-primary/10 text-primary rounded px-1 py-0.5 text-[8px] font-semibold">
          {badge}
        </p>
      </div>
    </div>
  );
}

export function IosInstallShot({ badge }: { badge: string }) {
  return (
    <div className="border-border bg-muted/20 relative h-28 overflow-hidden rounded-xl border">
      {/* eslint-disable-next-line @next/next/no-img-element -- local logo preview; no next/image localPatterns */}
      <img
        src="/icons/logo.png"
        alt=""
        className="absolute top-6 left-1/2 size-10 -translate-x-1/2 rounded-xl object-cover"
      />
      <div className="absolute top-1.5 right-2 flex size-6 items-center justify-center">
        <IosShareMark />
      </div>
      <div className="bg-background/95 border-border absolute inset-x-1.5 bottom-1.5 rounded-lg border px-1.5 py-1.5">
        <p className="text-foreground truncate text-center text-[8px] font-semibold">{badge}</p>
      </div>
    </div>
  );
}

function IosShareMark() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
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
