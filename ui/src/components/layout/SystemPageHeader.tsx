import { ArrowLeft } from 'lucide-react'

type SystemPageHeaderProps = {
  label: string
  onBack: () => void
  showBackButton?: boolean
  actions?: React.ReactNode
}

export function SystemPageHeader({
  label,
  onBack,
  showBackButton = true,
  actions,
}: SystemPageHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-zinc-900 bg-[#060910]/95">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-cyan-400 via-fuchsia-500 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.4)]" />

      <div className="absolute left-0 top-0 h-20 w-[32%] opacity-30 bg-[linear-gradient(135deg,transparent_0%,transparent_47%,rgba(34,211,238,0.16)_48%,transparent_49%,transparent_58%,rgba(34,211,238,0.07)_59%,transparent_60%)]" />

      <div className="absolute right-0 top-0 h-full w-[45%] opacity-30 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(34,211,238,0.15)_49%,transparent_50%,transparent_58%,rgba(217,70,239,0.12)_59%,transparent_60%)]" />

      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="shrink-0 lg:w-44">
            {showBackButton && (
              <button
                type="button"
                onClick={onBack}
                className="group relative h-11.5 overflow-hidden border border-zinc-800 bg-[#070a10] px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:border-cyan-400/60 hover:text-cyan-300"
              >
                <span className="absolute left-0 top-0 h-px w-6 bg-cyan-400 transition-all group-hover:w-full" />

                <span className="flex h-full items-center gap-3">
                  <ArrowLeft
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 transition-transform group-hover:-translate-x-1"
                  />

                  <span className="leading-none">
                    HISTORY
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-3">
                  <span className="h-px w-8 shrink-0 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />

                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.38em] text-cyan-300/80">
                    SOUND VOLTEX
                  </span>

                  <span className="h-1 w-1 shrink-0 bg-fuchsia-400" />
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <span className="whitespace-nowrap font-mono text-2xl font-black italic uppercase tracking-[0.12em] text-white sm:text-3xl">
                    <span className="text-cyan-300">
                      SDVX
                    </span>

                    <span className="mx-2 text-zinc-700">
                      /
                    </span>

                    PLAYLOG
                  </span>

                  <span className="hidden h-px w-12 shrink-0 bg-fuchsia-400/60 sm:block" />

                  <span className="hidden shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-300 sm:block">
                    {label}
                  </span>
                </div>
              </div>

              {actions && (
                <div className="flex shrink-0 items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-cyan-400/60 via-zinc-800 to-fuchsia-400/40" />
    </header>
  )
}
