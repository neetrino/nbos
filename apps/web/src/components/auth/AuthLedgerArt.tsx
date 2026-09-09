import {
  AUTH_SCENE_BODY,
  AUTH_SCENE_EYEBROW,
  AUTH_SCENE_HEADLINE,
  AUTH_SCENE_STAGES,
} from './auth-scene-constants';

export function AuthLedgerArt() {
  return (
    <div className="nbos-auth-ledger relative flex h-full min-h-[14rem] flex-col justify-between p-6 text-white sm:min-h-[18rem] sm:p-10 lg:min-h-full lg:p-12">
      <div className="relative z-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- auth mark; fixed SVG, no next/image benefit */}
        <img
          src="/logo/logo.svg"
          alt="NBOS"
          width={168}
          height={28}
          className="h-7 w-auto brightness-0 invert"
        />
        <p className="mt-8 text-[11px] font-semibold tracking-[0.22em] text-white/60 uppercase">
          {AUTH_SCENE_EYEBROW}
        </p>
        <h1 className="nbos-display mt-3 max-w-md text-4xl text-white sm:text-5xl">
          {AUTH_SCENE_HEADLINE}
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">
          {AUTH_SCENE_BODY}
        </p>
      </div>

      <div className="relative z-10 mt-10">
        <ol className="flex flex-wrap gap-2">
          {AUTH_SCENE_STAGES.map((stage, index) => (
            <li
              key={stage}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium tracking-wide text-white/85"
            >
              <span className="font-mono text-[10px] text-white/50">
                {String(index + 1).padStart(2, '0')}
              </span>
              {stage}
            </li>
          ))}
        </ol>
        <p
          className="nbos-folio absolute right-0 -bottom-6 hidden text-white/15 lg:block"
          aria-hidden
        >
          01
        </p>
      </div>
    </div>
  );
}
