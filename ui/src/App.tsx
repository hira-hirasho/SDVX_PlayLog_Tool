import { useMemo } from 'react'

import { ScoreCard } from './components/playlog/ScoreCard'
import { PlayLogFilters } from './components/playlog/PlayLogFilters'
import { usePlayLogs } from './hooks/usePlayLogs'
import { usePlayLogNavigation } from './hooks/usePlayLogNavigation'
import { usePlayLogFilters } from './hooks/usePlayLogFilters'
import { useSystemReady } from './hooks/useSystemReady'
import { usePagination } from './hooks/usePagination'
import { DetailView } from './components/playlog/DetailView'
import { FxStyles } from './components/effects/FxStyles'


export default function App() {

  const { selectedId, openDetail, goBack } = usePlayLogNavigation()

  const {
    songName,
    setSongName,
    artist,
    setArtist,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    resetFilters: resetFilterValues,
  } = usePlayLogFilters()

  const resetFilters = () => {
    setPage(0)
    resetFilterValues()
  }

  // Single boot-up moment on first mount — echoes an arcade cabinet coming
  // online. Everything else on this page stays still.
  const systemReady = useSystemReady()

  const { page, setPage } = usePagination()

  const { rows, total, pageSize, refresh } = usePlayLogs({
    page,
    startDate,
    endDate,
    songName,
    artist,
  })

  const totalPages = Math.ceil(total / pageSize)

  const selectedRow = useMemo(
    () => rows.find((row) => row.play_id === selectedId) ?? null,
    [rows, selectedId],
  )


  if (selectedId && selectedRow) {
    return (
      <DetailView
        row={selectedRow}
        onBack={goBack}
        onUpdated={refresh}
      />
    )
  }

  // Re-keying the list block replays its entrance once per query change, so
  // motion here answers the person's own filtering action rather than
  // looping on its own.
  const listKey = `${page}-${songName}-${artist}-${startDate}-${endDate}`

  return (
    <div className="plg-page-in relative min-h-screen overflow-hidden bg-[#03050a] text-zinc-100">
      <FxStyles />

      {/* Global animated atmosphere */}
      <div className="plg-grid-anim pointer-events-none fixed inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[40px_40px]" />

      {/* Deep ambient light field */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="plg-ambient-cyan absolute left-[-20%] top-[-25%] h-[90vh] w-[90vw] rounded-full bg-cyan-400/20 blur-[160px]" />

        <div className="plg-ambient-magenta absolute bottom-[-25%] right-[-20%] h-[85vh] w-[85vw] rounded-full bg-fuchsia-500/15 blur-[150px]" />

        {/* Central depth field */}
        <div className="plg-depth-pulse absolute left-1/2 top-1/2 h-[65vh] w-[65vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/5 blur-[110px]" />

        {/* Very slow orbital atmosphere */}
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
        {/* Moving cyan atmosphere */}
        <div className="plg-orb-cyan absolute left-[-15%] top-[-15%] h-[70vh] w-[70vw] rounded-full bg-cyan-400/20 blur-[140px]" />

        {/* Moving magenta atmosphere */}
        <div className="plg-orb-magenta absolute right-[-15%] bottom-[-15%] h-[65vh] w-[65vw] rounded-full bg-fuchsia-500/20 blur-[130px]" />

        {/* Horizontal energy sweep */}
        <div className="plg-energy-line absolute left-0 top-[28%] h-px w-[75vw] bg-linear-to-r from-transparent via-cyan-300/70 to-transparent blur-[1px]" />

        {/* Reverse energy sweep */}
        <div className="plg-energy-line-reverse absolute right-0 top-[68%] h-px w-[80vw] bg-linear-to-r from-transparent via-fuchsia-400/60 to-transparent blur-[1px]" />

        {/* Fast vertical scan */}
        <div className="plg-scan-line-fast absolute left-[28%] top-0 h-px w-[45vw] rotate-90 bg-linear-to-r from-transparent via-cyan-300/60 to-transparent blur-[1px]" />

        {/* Secondary vertical scan */}
        <div className="plg-scan-line-fast absolute right-[22%] top-0 h-px w-[38vw] rotate-90 bg-linear-to-r from-transparent via-fuchsia-300/50 to-transparent blur-[1px]" />
      </div>

      {/* Left system rail */}
      <aside className="fixed bottom-0 left-0 top-0 hidden w-18 border-r border-zinc-900/90 bg-[#03050a]/95 lg:flex lg:flex-col lg:items-center">
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
                className={`h-1.5 w-1.5 animate-pulse ${systemReady ? 'bg-emerald-400 shadow-[0_0_7px_rgba(74,222,128,0.8)]' : 'bg-amber-400 shadow-[0_0_7px_rgba(251,191,36,0.7)]'}`}
              />

              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 [writing-mode:vertical-rl]">
                {systemReady ? 'ONLINE' : 'BOOT'}
              </span>
            </div>

            <div className="h-10 w-px bg-linear-to-b from-cyan-400/40 to-transparent" />

            <div className="flex flex-col items-center gap-2 text-cyan-400/70">
              <span className="font-mono text-[11px]">01</span>

              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] [writing-mode:vertical-rl]">
                DATABASE
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

        <div className="mt-auto mb-8 flex flex-col items-center gap-3">
          <span className="h-8 w-px bg-linear-to-b from-zinc-800 to-transparent" />

          <span className="rotate-180 font-mono text-[9px] font-bold tracking-[0.3em] text-zinc-600 [writing-mode:vertical-rl]">
            PLAYLOG SYSTEM
          </span>
        </div>
      </aside>

      <div className="relative lg:pl-18">
        {/* Header */}
        <header className="relative overflow-hidden border-b border-zinc-900 bg-[#060910]/95">
          {/* Top neon rail */}
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-cyan-400 via-fuchsia-500 to-transparent" />

          <div className="absolute left-0 top-0 h-20 w-[32%] opacity-30 bg-[linear-gradient(135deg,transparent_0%,transparent_47%,rgba(34,211,238,0.16)_48%,transparent_49%,transparent_58%,rgba(34,211,238,0.07)_59%,transparent_60%)]" />

          <div className="absolute right-0 top-0 h-full w-[45%] opacity-30 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(34,211,238,0.15)_49%,transparent_50%,transparent_58%,rgba(217,70,239,0.12)_59%,transparent_60%)]" />

          <div className="relative mx-auto max-w-[1600px] px-6 pb-5 pt-6">
            {/* Main title terminal */}
            <div className="relative mb-5 flex items-stretch justify-between gap-8">
              <div className="relative min-w-0">
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-px w-8 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />

                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.38em] text-cyan-300/80">
                    SOUND VOLTEX
                  </span>

                  <span className="h-1 w-1 bg-fuchsia-400" />
                </div>

                <div className="relative inline-block">
                  <span className="absolute -left-4 top-1/2 h-px w-10 -translate-y-1/2 bg-cyan-400/70 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />

                  <span className="absolute -right-5 top-1/2 h-px w-10 -translate-y-1/2 bg-fuchsia-500/60 shadow-[0_0_8px_rgba(217,70,239,0.6)]" />

                  <h1 className="relative font-mono text-4xl font-black italic uppercase tracking-[0.16em] text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.22)] sm:text-5xl lg:text-6xl">
                    <span className="text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">SDVX</span><span className="mx-3 text-zinc-700">/</span><span className="tracking-[0.2em] text-white">PLAYLOG</span><span className="ml-3 text-fuchsia-300 drop-shadow-[0_0_12px_rgba(217,70,239,0.7)]">TOOL</span>
                  </h1>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    PERFORMANCE ARCHIVE
                  </span>

                  <span className="h-px w-10 bg-zinc-800" />

                  <span className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/70">
                    <span
                      className={`h-1 w-1 shadow-[0_0_5px_rgba(74,222,128,0.8)] ${systemReady ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'}`}
                    />
                    {systemReady ? 'ONLINE' : 'CONNECTING'}
                  </span>
                </div>
              </div>

              {/* Database status */}
              <div className="hidden shrink-0 items-center gap-5 sm:flex">
                <div className="h-12 w-px bg-zinc-800" />

                <div className="text-right">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                    DATABASE
                  </div>

                  <div className="mt-1 flex items-center justify-end gap-2">
                    <span
                      className={`h-1.5 w-1.5 shadow-[0_0_7px_rgba(74,222,128,0.8)] ${systemReady ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'}`}
                    />

                    <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-emerald-400/70">
                      {systemReady ? 'CONNECTED' : 'LINKING'}
                    </span>
                  </div>

                  <div
                    className={`plg-fade-in-block mt-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-zinc-400 ${systemReady ? '' : 'opacity-0'}`}
                  >
                    {total.toLocaleString('ja-JP').padStart(4, '0')} RECORDS
                  </div>
                </div>
              </div>
            </div>

            {/* Search console */}
            <div className="relative border border-zinc-900 bg-[#04070c]/80 p-3">
              <div className="absolute left-0 top-0 h-px w-20 bg-cyan-400/70" />

              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                    QUERY TERMINAL
                  </span>

                  <span className="h-1 w-1 bg-cyan-400" />
                </div>

                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  FILTER / SEARCH
                </span>
              </div>

              <PlayLogFilters
                songName={songName}
                setSongName={setSongName}
                artist={artist}
                setArtist={setArtist}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                setPage={setPage}
                resetFilters={resetFilters}
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-cyan-400/60 via-zinc-800 to-fuchsia-400/30" />
        </header>

        {/* Records */}
        <main className="relative mx-auto max-w-[1600px] px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                PLAY RECORDS
              </span>

              <span className="h-px w-8 bg-zinc-800" />

              <span className="font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.16em] text-zinc-600">
                PAGE {String(page + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="hidden items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600 sm:flex">
              <span className="h-1 w-1 animate-pulse bg-emerald-400/70" />
              LIVE DATABASE
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="relative flex min-h-60 items-center justify-center overflow-hidden border border-dashed border-zinc-900 bg-[#070a10]">
              <div className="absolute left-0 top-0 h-px w-24 bg-cyan-400/40" />

              <div className="absolute right-0 bottom-0 h-px w-24 bg-fuchsia-400/30" />

              <div className="text-center">
                <div className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-700">
                  NO DATA
                </div>

                <div className="mt-2 text-sm text-zinc-800">
                  該当するプレイ履歴がありません
                </div>
              </div>
            </div>
          ) : (
            <div key={listKey} className="plg-fade-in-block space-y-1.5">
              {rows.map((row) => (
                <ScoreCard
                  key={row.play_id}
                  row={row}
                  onClick={() => openDetail(row.play_id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
                className="group relative overflow-hidden border border-zinc-800 bg-[#070a10] px-5 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition hover:border-cyan-400/50 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-20"
              >
                <span className="absolute left-0 top-0 h-px w-5 bg-cyan-400/50 group-hover:w-full" />
                ← PREV
              </button>

              <div className="flex items-center gap-2 border border-zinc-900 bg-[#060910] px-4 py-2.5">
                <span className="font-mono text-[9px] text-zinc-600">
                  PAGE
                </span>

                <span className="font-mono text-[10px] font-bold tabular-nums text-zinc-300">
                  {String(page + 1).padStart(2, '0')}
                </span>

                <span className="font-mono text-[9px] text-zinc-800">
                  /
                </span>

                <span className="font-mono text-[10px] tabular-nums text-zinc-600">
                  {String(totalPages).padStart(2, '0')}
                </span>
              </div>

              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((current) => current + 1)}
                className="group relative overflow-hidden border border-zinc-800 bg-[#070a10] px-5 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition hover:border-fuchsia-400/50 hover:text-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-20"
              >
                <span className="absolute right-0 top-0 h-px w-5 bg-fuchsia-400/50 group-hover:w-full" />
                NEXT →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
