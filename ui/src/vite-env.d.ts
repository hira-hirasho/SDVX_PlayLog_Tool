/// <reference types="vite/client" />

interface PlayLogRow {
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

    trashPlayMedia: (
      playId: string,
      mediaType: 'result' | 'replay',
    ) => Promise<{
      trashed: boolean
      reason?: string
    }>

    updatePlayLog: (
      playId: string,
      values: {
        song_name: string | null
        artist: string | null
        difficulty: string | null
        level: number | null
        score: number | null
        score_delta: number | null
        ex_score: number | null
        ex_score_delta: number | null
      },
    ) => Promise<{
      updated: boolean
    }>
  }
}
