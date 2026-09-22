/// <reference types="vite/client" />

import type {
  PlayLogListResult,
} from './types/playLog'

declare global {
  interface Window {
    api: {
      getPlayLogs: (options?: {
        limit?: number
        offset?: number
        startDate?: string | null
        endDate?: string | null
        songName?: string | null
        artist?: string | null
        scoreImproved?: boolean
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

      deletePlayRecord: (
        playId: string,
      ) => Promise<{
        deleted: boolean
        reason?: string
      }>

      openExternal: (
        url: string,
      ) => Promise<{
        opened: boolean
        reason?: string
      }>

      openPlayMediaFolder: (
        playId: string,
      ) => Promise<{
        opened: boolean
        reason?: string
      }>
    }
  }
}

export {}
