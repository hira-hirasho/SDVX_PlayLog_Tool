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
        clear_type,
        rate_type,
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
          clear_type = @clear_type,
          rate_type = @rate_type,
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
        clear_type,
        rate_type,
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

export function getTodaysPlaySummary(date) {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error('Invalid date')
  }

  const [year, month, day] = date
    .split('-')
    .map(Number)

  const nextDate = new Date(
    year,
    month - 1,
    day + 1,
  )

  const nextDateString = [
    nextDate.getFullYear(),
    String(nextDate.getMonth() + 1).padStart(2, '0'),
    String(nextDate.getDate()).padStart(2, '0'),
  ].join('-')

  const db = getDatabase()

  try {
    const rows = db
      .prepare(`
        SELECT
          play_id,
          played_at,
          song_name,
          artist,
          difficulty,
          level,
          clear_type,
          rate_type,
          score,
          score_delta,
          ex_score,
          ex_score_delta
        FROM play_log
        WHERE
          played_at >= @startDate
          AND played_at < @endDate
        ORDER BY
          score DESC,
          played_at DESC
      `)
      .all({
        startDate: `${date}T00:00:00`,
        endDate: `${nextDateString}T00:00:00`,
      })

    const bestRowsBySong = new Map()

    for (const row of rows) {
      const songKey = row.song_name ?? ''

      if (!bestRowsBySong.has(songKey)) {
        bestRowsBySong.set(songKey, {
          ...row,
          total_score_delta:
            row.score_delta > 0
              ? row.score_delta
              : 0,
        })
      } else {
        const existing = bestRowsBySong.get(songKey)

        if (row.score_delta > 0) {
          existing.total_score_delta += row.score_delta
        }
      }
    }

    const bestRows = Array.from(
      bestRowsBySong.values(),
    )

    const improvedRows = bestRows.filter(
      (row) => row.total_score_delta > 0,
    )

    return {
      played: bestRows.length,
      improved: improvedRows.length,
      improvedRows,
    }
  } finally {
    db.close()
  }
}
