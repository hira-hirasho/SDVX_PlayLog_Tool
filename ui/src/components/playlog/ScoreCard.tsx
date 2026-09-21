import type { CSSProperties } from 'react'

import type { PlayLogRow } from '../../types/playLog'

import {
  difficultyColors,
  gradeColors,
  getGrade,
  formatScore,
  formatDelta,
  formatDate,
  getDeltaClass,
} from '../../utils/playLog'

export function ScoreCard({
  row,
  onClick,
}: {
  row: PlayLogRow
  onClick: () => void
}) {
  const grade = getGrade(row.score)
  const gradeColor = gradeColors[grade] ?? '#888'
  const difficultyColor = difficultyColors[row.difficulty] ?? '#888'

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ '--glow': `${gradeColor}33` } as CSSProperties}
      className="group relative grid w-full grid-cols-[64px_minmax(220px,1fr)_120px_130px_120px_130px_120px_150px] items-center gap-4 overflow-hidden border border-zinc-800/80 bg-[#080b12]/90 px-4 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-[#0d111b] hover:shadow-[0_0_18px_var(--glow)]"
    >
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{
          backgroundColor: gradeColor,
          boxShadow: `0 0 5px ${gradeColor}55`,
        }}
      />

      <span className="absolute right-0 top-0 h-full w-px bg-linear-to-b from-transparent via-zinc-800 to-transparent" />

      <div
        className="relative flex h-10 w-14 shrink-0 items-center justify-center border text-xl font-black"
        style={{
          color: gradeColor,
          borderColor: `${gradeColor}55`,
          backgroundColor: `${gradeColor}0D`,
          clipPath:
            'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        }}
      >
        {grade}
      </div>

      <div className="min-w-0">
        <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-700">
          TRACK
        </div>

        <div
          className="truncate text-sm font-semibold text-zinc-100"
          title={row.song_name}
        >
          {row.song_name}
        </div>

        <div
          className="truncate text-xs text-zinc-500"
          title={row.artist}
        >
          {row.artist}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-12 shrink-0 items-center justify-center border text-xs font-bold"
          style={{
            color: difficultyColor,
            borderColor: `${difficultyColor}88`,
            backgroundColor: `${difficultyColor}12`,
            clipPath:
              'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
          }}
        >
          {row.difficulty}
        </span>

        <span className="flex h-6 w-8 shrink-0 items-center justify-center font-mono text-sm font-semibold tabular-nums text-zinc-300">
          {row.level}
        </span>
      </div>

      <div>
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-700">
          SCORE
        </div>

        <div className="font-mono text-base font-bold tabular-nums text-zinc-100">
          {formatScore(row.score)}
        </div>
      </div>

      <div>
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-700">
          SCORE Δ
        </div>

        <div
          className={`font-mono text-sm font-semibold tabular-nums ${getDeltaClass(row.score_delta)}`}
        >
          {formatDelta(row.score_delta)}
        </div>
      </div>

      <div>
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-700">
          EX SCORE
        </div>

        <div className="font-mono text-sm font-semibold tabular-nums text-zinc-300">
          {formatScore(row.ex_score)}
        </div>
      </div>

      <div>
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-700">
          EX SCORE Δ
        </div>

        <div
          className={`font-mono text-sm font-semibold tabular-nums ${getDeltaClass(row.ex_score_delta)}`}
        >
          {formatDelta(row.ex_score_delta)}
        </div>
      </div>

      <div className="whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-zinc-600">
        {formatDate(row.played_at)}
      </div>
    </button>
  )
}
