export type PlayLogRow = {
  play_id: string
  played_at: string
  song_name: string | null
  artist: string | null
  difficulty: string | null
  level: number | null
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
