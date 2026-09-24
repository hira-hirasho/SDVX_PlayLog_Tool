export type ClearType =
  | 'COMPLETE'
  | 'ULTIMATECHAIN'
  | 'PERFECT'
  | 'CRASH'

export type RateType =
  | 'EFFECTIVE RATE'
  | 'EXCESSIVE RATE'
  | 'MAXXIVE RATE'

export type PlayLogRow = {
  play_id: string
  played_at: string
  song_name: string | null
  artist: string | null
  difficulty: string | null
  level: number | null
  clear_type: ClearType | null
  rate_type: RateType | null
  score: number | null
  score_delta: number | null
  ex_score: number | null
  ex_score_delta: number | null
  has_replay_video: boolean
}

export type PlayLogListResult = {
  rows: PlayLogRow[]
  total: number
}
