export const difficultyColors: Record<string, string> = {
  NOV: '#008CFF',
  ADV: '#FFD700',
  EXH: '#FF3030',
  INF: '#FF1493',
  MXM: '#D8D8D8',
  GRV: '#FFA500',
  HVN: '#00BFFF',
  VVD: '#FA2878',
  XCD: '#3144FF',
  ULT: '#FFFF42',
  NBL: '#B060FF',
}

export const gradeColors: Record<string, string> = {
  D: '#55585C',
  C: '#777B80',
  B: '#A8753E',
  A: '#C28A45',
  'A+': '#D49A3A',
  AA: '#E0AA32',
  'AA+': '#E8B92F',
  AAA: '#F0C52D',
  'AAA+': '#F6D45A',
  S: '#FFE98A',
}

export function getGrade(score: number): string {
  if (score >= 9_900_000) return 'S'
  if (score >= 9_800_000) return 'AAA+'
  if (score >= 9_700_000) return 'AAA'
  if (score >= 9_500_000) return 'AA+'
  if (score >= 9_300_000) return 'AA'
  if (score >= 9_000_000) return 'A+'
  if (score >= 8_700_000) return 'A'
  if (score >= 7_500_000) return 'B'
  if (score >= 6_500_000) return 'C'
  return 'D'
}

export function formatScore(value: number): string {
  return value.toLocaleString('ja-JP')
}

export function formatDelta(value: number): string {
  if (value > 0) return `+${value.toLocaleString('ja-JP')}`
  return value.toLocaleString('ja-JP')
}

export function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getDeltaClass(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-rose-400'
  return 'text-zinc-500'
}

/**
 * Shared keyframes for the playlog UI.
 *
 * Motion is deliberately concentrated in a few places rather than spread
 * across every element: one ambient "system scan" line, one boot-up reveal
 * per page, and one focal "grade stamp" moment on the detail screen (the
 * emotional payoff of a play, mirroring how SDVX itself slams a rank onto
 * the result screen). Everything else stays quiet.
 */
