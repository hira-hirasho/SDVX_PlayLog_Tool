import { Settings, Terminal } from 'lucide-react'

import { useSystemReady } from '../../hooks/useSystemReady'

type SystemSidebarProps = {
  onSettings: () => void
  onTerminal: () => void
  terminalOpen: boolean
  section: {
    index: string
    label: string
  }
}

export function SystemSidebar({
  onSettings,
  onTerminal,
  terminalOpen,
  section,
}: SystemSidebarProps) {
  const systemReady = useSystemReady()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-18 border-r border-zinc-900/90 bg-[#03050a]/95 lg:flex lg:flex-col lg:items-center">
      <div className="flex w-full flex-col items-center">
        {/* System mark */}
        <div className="relative flex h-20 w-full items-center justify-center border-b border-zinc-900">
          <div className="absolute left-0 top-0 h-px w-8 bg-cyan-400" />

          <div className="relative flex h-9 w-9 items-center justify-center border border-cyan-400/60 bg-cyan-400/4 font-black text-cyan-300">
            <span className="text-sm">S</span>

            <span className="absolute -right-1 -top-1 h-1.5 w-1.5 bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.9)]" />

            <span className="absolute -bottom-1 -left-1 h-1.5 w-1.5 bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]" />
          </div>
        </div>

        {/* Non-interactive status modules */}
        <div className="mt-8 flex w-full flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`h-1.5 w-1.5 animate-pulse ${
                systemReady
                  ? 'bg-emerald-400 shadow-[0_0_7px_rgba(74,222,128,0.8)]'
                  : 'bg-amber-400 shadow-[0_0_7px_rgba(251,191,36,0.7)]'
              }`}
            />

            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 [writing-mode:vertical-rl]">
              {systemReady ? 'ONLINE' : 'BOOT'}
            </span>
          </div>

          <div className="h-10 w-px bg-linear-to-b from-cyan-400/40 to-transparent" />

          <div className="flex flex-col items-center gap-2 text-cyan-400/70">
            <span className="font-mono text-[11px]">
              {section.index}
            </span>

            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] [writing-mode:vertical-rl]">
              {section.label}
            </span>
          </div>

          <div className="h-10 w-px bg-linear-to-b from-transparent to-zinc-900" />

          <div className="flex flex-col items-center gap-2 text-zinc-800">
            <span className="text-sm">◇</span>

            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] [writing-mode:vertical-rl]">
              ARCHIVE
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto mb-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onTerminal}
          aria-label={terminalOpen ? 'Close terminal' : 'Open terminal'}
          title={terminalOpen ? 'Close terminal' : 'Terminal'}
          className={`group relative flex h-10 w-10 items-center justify-center border bg-[#070a10] transition ${
            terminalOpen
              ? 'border-cyan-400/60 text-cyan-300'
              : 'border-zinc-800 text-zinc-500 hover:border-cyan-400/60 hover:text-cyan-300'
          }`}
        >
          <span
            className={`absolute left-0 top-0 h-px bg-cyan-400/60 transition-all ${
              terminalOpen ? 'w-full' : 'w-4 group-hover:w-full'
            }`}
          />
          <Terminal
            size={17}
            strokeWidth={1.8}
          />
        </button>

        <button
          type="button"
          onClick={onSettings}
          aria-label="Open settings"
          title="Settings"
          className="group relative flex h-10 w-10 items-center justify-center border border-zinc-800 bg-[#070a10] text-zinc-500 transition hover:border-cyan-400/60 hover:text-cyan-300"
        >
          <span className="absolute left-0 top-0 h-px w-4 bg-cyan-400 transition-all group-hover:w-full" />

          <Settings
            size={17}
            strokeWidth={1.8}
          />
        </button>
      </div>
    </aside>
  )
}
