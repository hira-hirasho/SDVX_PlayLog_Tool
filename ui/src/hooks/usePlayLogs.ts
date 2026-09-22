import { useCallback, useEffect, useState } from 'react'

import type { PlayLogRow } from '../types/playLog'

const PAGE_SIZE = 50

type UsePlayLogsParams = {
  page: number
  startDate: string
  endDate: string
  songName: string
  artist: string
  scoreImproved: boolean
}

export function usePlayLogs({
  page,
  startDate,
  endDate,
  songName,
  artist,
  scoreImproved,
}: UsePlayLogsParams) {
  const [rows, setRows] = useState<PlayLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchRows = async () => {
      const result = await window.api.getPlayLogs({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        startDate: startDate || null,
        endDate: endDate || null,
        songName: songName || null,
        artist: artist || null,
        scoreImproved,
      })

      if (cancelled) return

      setRows(result.rows)
      setTotal(result.total)
    }

    void fetchRows()

    return () => {
      cancelled = true
    }
  }, [page, startDate, endDate, songName, artist, scoreImproved, reloadKey])

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1)
  }, [])

  return {
    rows,
    total,
    pageSize: PAGE_SIZE,
    refresh,
  }
}
