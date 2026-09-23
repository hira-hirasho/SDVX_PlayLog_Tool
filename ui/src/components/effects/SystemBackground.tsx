import { FxStyles } from './FxStyles'

export function SystemBackground() {
  return (
    <>
      <FxStyles />

      {/* Global animated atmosphere */}
      <div className="plg-grid-anim pointer-events-none fixed inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[40px_40px]" />

      {/* Deep ambient light field */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="plg-ambient-cyan absolute left-[-20%] top-[-25%] h-[90vh] w-[90vw] rounded-full bg-cyan-400/20 blur-[160px]" />
        <div className="plg-ambient-magenta absolute bottom-[-25%] right-[-20%] h-[85vh] w-[85vw] rounded-full bg-fuchsia-500/15 blur-[150px]" />
        <div className="plg-depth-pulse absolute left-1/2 top-1/2 h-[65vh] w-[65vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/5 blur-[110px]" />
        <div className="plg-orbit absolute left-1/2 top-1/2 h-[75vh] w-[75vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/5" />
      </div>

      {/* Soft vertical system scan */}
      <div className="plg-scan-line pointer-events-none fixed inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/40 to-transparent blur-[1px]" />

      {/* Edge atmosphere */}
      <div className="pointer-events-none fixed inset-0 bg-linear-to-br from-cyan-400/2 via-transparent to-fuchsia-500/3" />
      <div className="pointer-events-none fixed left-0 top-0 h-screen w-px bg-linear-to-b from-cyan-400 via-cyan-400/20 to-transparent" />
      <div className="pointer-events-none fixed right-0 top-0 h-screen w-px bg-linear-to-b from-fuchsia-500 via-fuchsia-500/20 to-transparent" />

      {/* Animated background energy field */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="plg-orb-cyan absolute left-[-15%] top-[-15%] h-[70vh] w-[70vw] rounded-full bg-cyan-400/20 blur-[140px]" />
        <div className="plg-orb-magenta absolute right-[-15%] bottom-[-15%] h-[65vh] w-[65vw] rounded-full bg-fuchsia-500/20 blur-[130px]" />
        <div className="plg-energy-line absolute left-0 top-[28%] h-px w-[75vw] bg-linear-to-r from-transparent via-cyan-300/70 to-transparent blur-[1px]" />
        <div className="plg-energy-line-reverse absolute right-0 top-[68%] h-px w-[80vw] bg-linear-to-r from-transparent via-fuchsia-400/60 to-transparent blur-[1px]" />
        <div className="plg-scan-line-fast absolute left-[28%] top-0 h-px w-[45vw] rotate-90 bg-linear-to-r from-transparent via-cyan-300/60 to-transparent blur-[1px]" />
        <div className="plg-scan-line-fast absolute right-[22%] top-0 h-px w-[38vw] rotate-90 bg-linear-to-r from-transparent via-fuchsia-300/50 to-transparent blur-[1px]" />
      </div>
    </>
  )
}
