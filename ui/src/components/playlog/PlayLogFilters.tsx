type PlayLogFiltersProps = {
  songName: string
  setSongName: (value: string) => void
  artist: string
  setArtist: (value: string) => void
  startDate: string
  setStartDate: (value: string) => void
  endDate: string
  setEndDate: (value: string) => void
  scoreImproved: boolean
  setScoreImproved: (value: boolean) => void
  setPage: (value: number) => void
  resetFilters: () => void
}

export function PlayLogFilters({
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
  setPage,
  resetFilters,
}: PlayLogFiltersProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr_1fr_auto_auto]">
      <div className="relative">
        <span className="absolute left-3 top-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-400/70">
          TRACK
        </span>

        <input
          value={songName}
          onChange={(event) => {
            setPage(0)
            setSongName(event.target.value)
          }}
          placeholder="SEARCH TRACK"
          className="h-12 w-full border border-zinc-800 bg-[#070a10] px-3 pb-0 pt-5 font-mono text-sm font-medium text-zinc-200 outline-none transition focus:border-cyan-400/60 focus:bg-[#090d15] focus:shadow-[0_0_0_1px_rgba(34,211,238,0.25)] placeholder:text-zinc-600"
        />
      </div>

      <div className="relative">
        <span className="absolute left-3 top-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-fuchsia-400/70">
          ARTIST
        </span>

        <input
          value={artist}
          onChange={(event) => {
            setPage(0)
            setArtist(event.target.value)
          }}
          placeholder="SEARCH ARTIST"
          className="h-12 w-full border border-zinc-800 bg-[#070a10] px-3 pb-0 pt-5 font-mono text-sm font-medium text-zinc-200 outline-none transition focus:border-fuchsia-400/60 focus:bg-[#090d15] focus:shadow-[0_0_0_1px_rgba(217,70,239,0.25)] placeholder:text-zinc-600"
        />
      </div>

      <div className="relative">
        <span className="absolute left-3 top-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          FROM DATE
        </span>

        <input
          type="text"
          value={startDate}
          onChange={(event) => {
            setPage(0)
            setStartDate(event.target.value)
          }}
          placeholder="YYYY-MM-DD"
          className="h-12 w-full border border-zinc-800 bg-[#070a10] px-3 pb-0 pt-5 font-mono text-sm font-medium tabular-nums text-zinc-300 outline-none transition focus:border-cyan-400/40 focus:bg-[#090d15] placeholder:text-zinc-600"
        />
      </div>

      <div className="relative">
        <span className="absolute left-3 top-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          TO DATE
        </span>

        <input
          type="text"
          value={endDate}
          onChange={(event) => {
            setPage(0)
            setEndDate(event.target.value)
          }}
          placeholder="YYYY-MM-DD"
          className="h-12 w-full border border-zinc-800 bg-[#070a10] px-3 pb-0 pt-5 font-mono text-sm font-medium tabular-nums text-zinc-300 outline-none transition focus:border-fuchsia-400/40 focus:bg-[#090d15] placeholder:text-zinc-600"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setPage(0)
          setScoreImproved(!scoreImproved)
        }}
        className={`group relative h-12 overflow-hidden border bg-[#070a10] px-4 transition ${
          scoreImproved
            ? 'border-cyan-400/60 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
            : 'border-zinc-800'
        }`}
      >
        <span
          className={`absolute left-0 top-0 h-px transition-all ${
            scoreImproved
              ? 'w-full bg-cyan-400/70'
              : 'w-6 bg-zinc-700'
          }`}
        />

        <span className="flex items-center gap-3">
          <span
            className={`relative h-4 w-7 border transition ${
              scoreImproved
                ? 'border-cyan-400/70 bg-cyan-400/10'
                : 'border-zinc-700 bg-zinc-900'
            }`}
          >
            <span
              className={`absolute top-0.5 h-2.5 w-2.5 transition-all ${
                scoreImproved
                  ? 'left-3.5 bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                  : 'left-0.5 bg-zinc-600'
              }`}
            />
          </span>

          <span className="text-left">
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              SCORE
            </span>

            <span
              className={`block font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${
                scoreImproved ? 'text-cyan-300' : 'text-zinc-600'
              }`}
            >
              INCREASED
            </span>
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={resetFilters}
        className="group relative h-12 overflow-hidden border border-zinc-700 bg-[#080b12] px-5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition hover:border-cyan-400/70 hover:bg-cyan-400/5 hover:text-cyan-300"
      >
        <span className="absolute left-0 top-0 h-px w-6 bg-cyan-400/70 transition-all group-hover:w-full" />

        <span className="relative flex items-center gap-2">
          <span className="text-sm">?</span>
          RESET
        </span>
      </button>
    </div>
  )
}
