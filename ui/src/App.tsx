import { useMemo } from 'react'

import { ScoreCard } from './components/playlog/ScoreCard'
import { PlayLogFilters } from './components/playlog/PlayLogFilters'
import { usePlayLogs } from './hooks/usePlayLogs'
import { usePlayLogNavigation } from './hooks/usePlayLogNavigation'
import { usePlayLogFilters } from './hooks/usePlayLogFilters'
import { useSystemReady } from './hooks/useSystemReady'
import { usePagination } from './hooks/usePagination'
import { DetailView } from './components/playlog/DetailView'
import { SettingsView } from './components/settings/SettingsView'
import { SystemBackground } from './components/effects/SystemBackground'
import { SystemSidebar } from './components/layout/SystemSidebar'


export default function App() {

  const {
    selectedId,
    showSettings,
    openDetail,
    openSettings,
    goBack,
  } = usePlayLogNavigation()

  const {
    songName,
    setSongName,
    artist,
    setArtist,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    scoreImproved,
    setScoreImproved,
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
    scoreImproved,
  })

  const handleBack = () => {
    goBack()
    refresh()
  }

  const totalPages = Math.ceil(total / pageSize)

  const selectedRow = useMemo(
    () => rows.find((row) => row.play_id === selectedId) ?? null,
    [rows, selectedId],
  )

  if (showSettings) {
    return (
      <SettingsView
        onBack={goBack}
      />
    )
  }

  if (selectedId && selectedRow) {
    return (
      <DetailView
        row={selectedRow}
        onBack={handleBack}
        onUpdated={refresh}
        onSettings={openSettings}
      />
    )
  }

  // Re-keying the list block replays its entrance once per query change, so
  // motion here answers the person's own filtering action rather than
  // looping on its own.
  const listKey = `${page}-${songName}-${artist}-${startDate}-${endDate}-${scoreImproved}`

  return (
    <>
      <SystemSidebar
        onSettings={openSettings}
        section={{
          index: '01',
          label: 'DATABASE',
        }}
      />

      <div className="plg-page-in relative min-h-screen bg-[#03050a] text-zinc-100">
        <SystemBackground />

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
                  scoreImproved={scoreImproved}
                  setScoreImproved={setScoreImproved}
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
    </>
  )
}
