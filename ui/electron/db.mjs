import Database from 'better-sqlite3'
import path from 'node:path'
import { getDataRoot } from './paths.mjs'

const dbPath = path.join(
  getDataRoot(),
  'database',
  'playlog.db',
)

export function getDatabase() {
  return new Database(dbPath, {
    readonly: true,
  })
}

export function getPlayLogs({
  limit = 50,
  offset = 0,
  startDate = null,
  endDate = null,
  songName = null,
  artist = null,
} = {}) {
  const db = getDatabase()

  const conditions = []
  const params = {}

  if (startDate) {
    conditions.push('played_at >= @startDate')
    params.startDate = `${startDate}T00:00:00`
  }

  if (endDate) {
    conditions.push('played_at < @endDate')
    params.endDate = `${endDate}T00:00:00`
  }

  if (songName) {
    conditions.push('song_name LIKE @songName')
    params.songName = `%${songName}%`
  }

  if (artist) {
    conditions.push('artist LIKE @artist')
    params.artist = `%${artist}%`
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

  const rows = db
    .prepare(`
      SELECT
        play_id,
        played_at,
        song_name,
        artist,
        difficulty,
        level,
        score,
        score_delta,
        ex_score,
        ex_score_delta
      FROM play_log
      ${whereClause}
      ORDER BY played_at DESC
      LIMIT @limit
      OFFSET @offset
    `)
    .all({
      ...params,
      limit,
      offset,
    })

  const total = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM play_log
      ${whereClause}
    `)
    .get(params)

  db.close()

  return {
    rows,
    total: total.count,
  }
}
