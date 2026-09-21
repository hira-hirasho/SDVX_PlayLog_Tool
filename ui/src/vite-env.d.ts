/// <reference types="vite/client" />

interface PlayLogRow {
  play_id: string
  played_at: string
  song_name: string
  artist: string
  difficulty: string
  level: number
  score: number
  score_delta: number
  ex_score: number
  ex_score_delta: number
}

interface PlayLogListResult {
  rows: PlayLogRow[]
  total: number
}

interface Window {
  api: {
    getPlayLogs: (options?: {
      limit?: number
      offset?: number
      startDate?: string | null
      endDate?: string | null
      songName?: string | null
      artist?: string | null
    }) => Promise<PlayLogListResult>

    getPlayMedia: (playId: string) => Promise<{
      resultImage: string | null
      replayVideo: string | null
    }>
  }
}
