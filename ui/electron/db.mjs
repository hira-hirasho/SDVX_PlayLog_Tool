import Database from 'better-sqlite3'
import path from 'node:path'
import { getDataRoot } from './paths.mjs'

const dbPath = path.join(
  getDataRoot(),
  'database',
  'playlog.db',
)

export function getDatabase() {
  return new Database(dbPath)
}

export function getPlayLogs({
  limit = 50,
  offset = 0,
  startDate = null,
  endDate = null,
  songName = null,
  artist = null,
  scoreImproved = true,
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

  if (scoreImproved) {
    conditions.push(
      '(score_delta > 0 OR ex_score_delta > 0)',
    )
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

export function updatePlayLog(
  playId,
  {
    song_name,
    artist,
    difficulty,
    level,
    score,
    score_delta,
    ex_score,
    ex_score_delta,
  },
) {
  const db = getDatabase()

  try {
    const result = db
      .prepare(`
        UPDATE play_log
        SET
          song_name = @song_name,
          artist = @artist,
          difficulty = @difficulty,
          level = @level,
          score = @score,
          score_delta = @score_delta,
          ex_score = @ex_score,
          ex_score_delta = @ex_score_delta
        WHERE play_id = @play_id
      `)
      .run({
        play_id: playId,
        song_name,
        artist,
        difficulty,
        level,
        score,
        score_delta,
        ex_score,
        ex_score_delta,
      })

    return {
      updated: result.changes > 0,
    }
  } finally {
    db.close()
  }
}

export function deletePlayLog(playId) {
  const db = getDatabase()

  try {
    const result = db
      .prepare(`
        DELETE FROM play_log
        WHERE play_id = @play_id
      `)
      .run({
        play_id: playId,
      })

    return {
      deleted: result.changes > 0,
    }
  } finally {
    db.close()
  }
}
