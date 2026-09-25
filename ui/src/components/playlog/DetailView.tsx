import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { FolderOpen, Share2, Trash2 } from "lucide-react"

import type { PlayLogRow } from '../../types/playLog'
import { SystemBackground } from '../effects/SystemBackground'
import { SystemPageHeader } from '../layout/SystemPageHeader'
import { SystemSidebar } from '../layout/SystemSidebar'

import { ClearTypeBadge } from './ClearTypeBadge'
import { GradeBadge } from './GradeBadge'

import {
  difficultyColors,
  gradeColors,
  getGrade,
  formatScore,
  formatDelta,
  formatDate,
  getDeltaClass,
} from '../../utils/playLog'

export function DetailView({
  row,
  onBack,
  onUpdated,
  onSettings,
  onNavigate,
  hasPrevious,
  hasNext,
}: {
  row: PlayLogRow
  onBack: () => void
  onUpdated: () => void
  onSettings: () => void
  onNavigate: (
    direction: 'previous' | 'next',
  ) => void
  hasPrevious: boolean
  hasNext: boolean
}) {
  const [media, setMedia] = useState<{
    resultImage: string | null
    replayVideo: string | null
  }>({
    resultImage: null,
    replayVideo: null,
  })

  const clearTypeBadgeRef = useRef<HTMLDivElement>(null)

  const [clearTypePickerPosition, setClearTypePickerPosition] = useState<{
    left: number
    top: number
  } | null>(null)

  const [isClearTypePickerOpen, setIsClearTypePickerOpen] =
    useState(false)

  const [editedRow, setEditedRow] = useState(row)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const grade = getGrade(
    isEditing ? editedRow.score : row.score,
  )
  const gradeColor = gradeColors[grade] ?? '#888'

  const difficultyColor =
    difficultyColors[
      (isEditing ? editedRow.difficulty : row.difficulty) ?? ''
    ] ?? '#888'

  const [
    isRecordDeleteConfirmOpen,
    setIsRecordDeleteConfirmOpen,
  ] = useState(false)

  const [
    isDeletingRecord,
    setIsDeletingRecord,
  ] = useState(false)

  const [
    recordDeleteError,
    setRecordDeleteError,
  ] = useState<string | null>(null)

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [isDraggingImage, setIsDraggingImage] = useState(false)

  type MediaType = 'result' | 'replay'

  const [deleteTarget, setDeleteTarget] = useState<MediaType | null>(null)
  const [isDeletingMedia, setIsDeletingMedia] = useState(false)
  const [mediaDeleteError, setMediaDeleteError] = useState<string | null>(null)

  const dragStartRef = useRef({ x: 0, y: 0 })
  const offsetStartRef = useRef({ x: 0, y: 0 })
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [row.play_id])

  useEffect(() => {
    let cancelled = false

    const loadMedia = async () => {
      const result = await window.api.getPlayMedia(row.play_id)

      if (!cancelled) {
        setMedia(result)
      }
    }

    void loadMedia()

    return () => {
      cancelled = true
    }
  }, [row.play_id])

  useEffect(() => {
    if (!isImagePreviewOpen) return

    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImagePreviewOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isImagePreviewOpen])

  const startEditing = () => {
    setEditedRow(row)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setEditedRow(row)
    setIsEditing(false)
    setIsClearTypePickerOpen(false)
  }

  const saveEditing = async () => {
    setIsSaving(true)

    try {
      const result = await window.api.updatePlayLog(
        row.play_id,
        {
          song_name: editedRow.song_name,
          artist: editedRow.artist,
          difficulty: editedRow.difficulty,
          level: editedRow.level,
          clear_type: editedRow.clear_type,
          rate_type: editedRow.rate_type,
          score: editedRow.score,
          score_delta: editedRow.score_delta,
          ex_score: editedRow.ex_score,
          ex_score_delta: editedRow.ex_score_delta,
        },
      )

      if (!result.updated) {
        throw new Error('Play log was not found.')
      }

      setIsEditing(false)
      onUpdated()
    } catch (error) {
      console.error('Failed to update play log:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const clearTypeOptions: Array<{
    clearType: PlayLogRow['clear_type']
    rateType: PlayLogRow['rate_type']
  }> = [
    {
      clearType: 'COMPLETE',
      rateType: 'EFFECTIVE RATE',
    },
    {
      clearType: 'COMPLETE',
      rateType: 'EXCESSIVE RATE',
    },
    {
      clearType: 'COMPLETE',
      rateType: 'MAXXIVE RATE',
    },
    {
      clearType: 'ULTIMATECHAIN',
      rateType: null,
    },
    {
      clearType: 'PERFECT',
      rateType: null,
    },
    {
      clearType: 'CRASH',
      rateType: null,
    },
  ]

  const handleClearTypeChange = (
    clearType: PlayLogRow['clear_type'],
    rateType: PlayLogRow['rate_type'],
  ) => {
    if (!isEditing || isSaving) {
      return
    }

    setEditedRow((current) => ({
      ...current,
      clear_type: clearType,
      rate_type:
        rateType !== null
          ? rateType
          : current.rate_type,
    }))

    setIsClearTypePickerOpen(false)
  }

  const handleShare = async () => {
    const scoreText = formatScore(row.score)
    const scoreDeltaText = formatDelta(row.score_delta)

    const text = [
      `【${row.song_name ?? '-'} / ${row.artist ?? '-'}】`,
      `Level: ${row.difficulty ?? '-'} ${row.level ?? '-'}`,
      `Score: ${scoreText}(${scoreDeltaText})`,
      `#SDVX`,
    ].join('\n')

    const url =
      `https://x.com/intent/post?text=${encodeURIComponent(text)}`

    const result = await window.api.openExternal(url)

    if (!result.opened) {
      console.error('Failed to open X post composer:', result.reason)
      return
    }

    const mediaResult =
      await window.api.openPlayMediaFolder(row.play_id)

    if (!mediaResult.opened) {
      console.error(
        'Failed to open media folder:',
        mediaResult.reason,
      )
    }
  }

  const handleOpenMediaFolder = async () => {
    const result =
      await window.api.openPlayMediaFolder(row.play_id)

    if (!result.opened) {
      console.error(
        'Failed to open media folder:',
        result.reason,
      )
    }
  }

  const handleDeleteRecord = async () => {
    if (isDeletingRecord) return

    setIsDeletingRecord(true)
    setRecordDeleteError(null)

    videoRef.current?.pause()

    try {
      const result =
        await window.api.deletePlayRecord(
          row.play_id,
        )

      if (!result.deleted) {
        throw new Error(
          result.reason ?? 'delete_failed',
        )
      }

      setIsRecordDeleteConfirmOpen(false)

      onBack()
    } catch (error) {
      console.error(
        'Failed to delete play record:',
        error,
      )

      setRecordDeleteError(
        'プレイ記録を削除できませんでした。',
      )
    } finally {
      setIsDeletingRecord(false)
    }
  }

  const requestDeleteMedia = (mediaType: MediaType) => {
    setMediaDeleteError(null)
    setDeleteTarget(mediaType)
  }

  const handleDeleteMedia = async () => {
    if (!deleteTarget || isDeletingMedia) {
      return
    }

    const mediaType = deleteTarget

    if (mediaType === 'replay') {
      videoRef.current?.pause()
    }

    setIsDeletingMedia(true)
    setMediaDeleteError(null)

    try {
      const result = await window.api.trashPlayMedia(
        row.play_id,
        mediaType,
      )

      if (!result.trashed) {
        if (result.reason === 'not_found') {
          setMedia((current) => ({
            ...current,
            ...(mediaType === 'result'
              ? { resultImage: null }
              : { replayVideo: null }),
          }))
          setDeleteTarget(null)
          return
        }

        throw new Error(result.reason ?? 'trash_failed')
      }

      setMedia((current) => ({
        ...current,
        ...(mediaType === 'result'
          ? { resultImage: null }
          : { replayVideo: null }),
      }))

      if (mediaType === 'result') {
        setIsImagePreviewOpen(false)
      }

      setDeleteTarget(null)
    } catch (error) {
      console.error('Failed to move media to trash:', error)
      setMediaDeleteError(
        'メディアをゴミ箱へ移動できませんでした。',
      )
    } finally {
      setIsDeletingMedia(false)
    }
  }

  return (
    <>
      <SystemSidebar
        onSettings={onSettings}
        section={{
          index: '02',
          label: 'RECORD',
        }}
      />

      <div className="plg-page-in relative min-h-screen overflow-hidden bg-[#03050a] text-zinc-100">
        <SystemBackground />

        <div className="relative lg:pl-18">
          {/* Header */}
          <SystemPageHeader
            label="RECORD DETAIL"
            onBack={onBack}
            showBackButton={!isEditing}
            actions={
              !isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="group relative h-11.5 overflow-hidden border border-zinc-800 bg-[#070a10] font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:border-cyan-400/60 hover:text-cyan-300"
                  >
                    <span className="absolute left-0 top-0 h-px w-6 bg-cyan-400 transition-all group-hover:w-full" />

                    <span className="flex h-full items-center gap-3 px-5">
                      <Share2
                        size={17}
                        strokeWidth={1.8}
                        className="shrink-0"
                      />
                      SHARE
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMediaFolder}
                    className="group relative h-11.5 overflow-hidden border border-zinc-800 bg-[#070a10] font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:border-cyan-400/60 hover:text-cyan-300"
                  >
                    <span className="absolute left-0 top-0 h-px w-6 bg-cyan-400 transition-all group-hover:w-full" />

                    <span className="flex h-full items-center gap-3 px-5">
                      <FolderOpen
                        size={17}
                        strokeWidth={1.8}
                        className="shrink-0"
                      />
                      MEDIA
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={startEditing}
                    className="group relative h-11.5 overflow-hidden border border-zinc-800 bg-[#070a10] font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:border-fuchsia-400/60 hover:text-fuchsia-300"
                  >
                    <span className="absolute left-0 top-0 h-px w-6 bg-fuchsia-400 transition-all group-hover:w-full" />

                    <span className="flex h-full items-center gap-3 px-5">
                      <span className="text-lg leading-none">
                        ✎
                      </span>
                      EDIT
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={saveEditing}
                    disabled={isSaving}
                    className="group relative h-11.5 overflow-hidden border border-cyan-400/60 bg-[#070a10] px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    SAVE
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="group relative h-11.5 overflow-hidden border border-zinc-800 bg-[#070a10] px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    CANCEL
                  </button>
                </>
              )
            }
          />

          <main className="relative mx-auto max-w-325 px-6 py-6">
            <div className="flex min-w-0 items-stretch gap-3">
              <button
                type="button"
                disabled={!hasPrevious || isEditing}
                onClick={() => {
                  void onNavigate('previous')
                }}
                className="w-12 shrink-0 border border-zinc-800 bg-[#060910]/95 font-mono text-xs font-bold tracking-widest text-zinc-500 transition hover:border-cyan-400/60 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-20"
                aria-label="Previous record"
              >
                PREV
              </button>

              {/* Record hero */}
              <section className="min-w-0 flex-1 relative overflow-hidden border border-zinc-800 bg-[#060910]/95">
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-400/3 via-transparent to-fuchsia-500/4" />

                {isEditing && (
                  <button
                    type="button"
                    aria-label="Delete play record"
                    title="Delete play record"
                    onClick={() => {
                      setRecordDeleteError(null)
                      setIsRecordDeleteConfirmOpen(true)
                    }}
                    disabled={isDeletingRecord}
                    className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center border border-red-500/30 bg-red-500/5 text-zinc-500 transition-colors hover:border-red-400/70 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2
                      size={17}
                      strokeWidth={1.8}
                    />
                  </button>
                )}

                <div className="pointer-events-none absolute right-0 top-0 h-full w-[38%] opacity-40 bg-[linear-gradient(135deg,transparent_0%,transparent_47%,rgba(34,211,238,0.12)_48%,transparent_49%,transparent_57%,rgba(217,70,239,0.10)_58%,transparent_59%)]" />

                <div
                  className="absolute left-0 top-0 h-1 w-full"
                  style={{
                    backgroundColor: gradeColor,
                    boxShadow: `0 0 18px ${gradeColor}88`,
                  }}
                />

                <div className="relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-400/3 via-transparent to-fuchsia-500/4" />

                  <div className="relative p-6 sm:p-7 lg:p-8">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <span className="h-px w-12 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                        RECORD / PERFORMANCE
                      </span>
                    </div>

                    {/* Difficulty / Level / Date */}
                    <div className="mt-3 flex items-center gap-5">
                      {isEditing ? (
                        <>
                          <select
                            value={editedRow.difficulty ?? ''}
                            onChange={(event) => {
                              setEditedRow((current) => ({
                                ...current,
                                difficulty: event.target.value || null,
                              }))
                            }}
                            className="h-9 w-24 border border-fuchsia-400/50 bg-[#070a10] px-3 font-mono text-sm font-bold uppercase text-zinc-100 outline-none focus:border-fuchsia-400"
                          >
                            <option value="">---</option>
                            <option value="NOV">NOV</option>
                            <option value="ADV">ADV</option>
                            <option value="EXH">EXH</option>
                            <option value="MXM">MXM</option>
                            <option value="ULT">ULT</option>
                            <option value="INF">INF</option>
                            <option value="GRV">GRV</option>
                            <option value="HVN">HVN</option>
                            <option value="VVD">VVD</option>
                            <option value="XCD">XCD</option>
                            <option value="NBL">NBL</option>
                          </select>

                          <label className="flex h-9 items-center gap-2 font-mono text-lg font-black tracking-wide text-zinc-200">
                            LEVEL
                            <input
                              type="number"
                              value={editedRow.level ?? ''}
                              onChange={(event) => {
                                setEditedRow((current) => ({
                                  ...current,
                                  level:
                                    event.target.value === ''
                                      ? null
                                      : Number(event.target.value),
                                }))
                              }}
                              className="h-9 w-20 border border-fuchsia-400/50 bg-[#070a10] px-3 font-mono text-lg font-black text-zinc-100 outline-none focus:border-fuchsia-400"
                            />
                          </label>
                        </>
                      ) : (
                        <>
                          <span
                            className="flex h-9 w-16 shrink-0 items-center justify-center border text-sm font-black"
                            style={{
                              color: difficultyColor,
                              borderColor: `${difficultyColor}99`,
                              backgroundColor: `${difficultyColor}12`,
                              boxShadow: `0 0 18px ${difficultyColor}18`,
                            }}
                          >
                            {row.difficulty}
                          </span>

                          <span className="flex h-9 items-center font-mono text-lg font-black tracking-wide text-zinc-200">
                            LEVEL {row.level}
                          </span>
                        </>
                      )}

                      <span className="h-1 w-1 shrink-0 bg-zinc-700" />

                      <span className="flex h-9 items-center font-mono text-xs font-semibold tracking-wide text-zinc-500">
                        {formatDate(row.played_at)}
                      </span>
                    </div>

                    {/* Song / Grade */}
                    <div className="mt-3 flex items-center justify-between gap-6">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedRow.song_name ?? ''}
                            onChange={(event) => {
                              setEditedRow((current) => ({
                                ...current,
                                song_name: event.target.value || null,
                              }))
                            }}
                            className="w-full border border-fuchsia-400/50 bg-[#070a10] px-4 py-2 font-mono text-2xl font-black leading-tight text-white outline-none focus:border-fuchsia-400 sm:text-3xl lg:text-4xl"
                          />
                        ) : (
                          <h1
                            className="wrap-break-word font-mono text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-4xl"
                            title={row.song_name ?? ''}
                          >
                            {row.song_name ?? '\u00A0'}
                          </h1>
                        )}

                        {isEditing ? (
                          <input
                            type="text"
                            value={editedRow.artist ?? ''}
                            onChange={(event) => {
                              setEditedRow((current) => ({
                                ...current,
                                artist: event.target.value || null,
                              }))
                            }}
                            className="mt-1 w-full border border-fuchsia-400/50 bg-[#070a10] px-4 py-2 font-mono text-base font-semibold text-zinc-100 outline-none focus:border-fuchsia-400 sm:text-lg"
                          />
                        ) : (
                          <p
                            className="mt-1 wrap-break-word font-mono text-base font-semibold text-zinc-500 sm:text-lg"
                            title={row.artist ?? ''}
                          >
                            {row.artist ?? '\u00A0'}
                          </p>
                        )}
                      </div>

                      {/* Clear / Grade */}
                      <div
                        ref={clearTypeBadgeRef}
                        className="relative flex shrink-0 flex-col items-center gap-1.5"
                      >
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isClearTypePickerOpen) {
                                setIsClearTypePickerOpen(false)
                                return
                              }

                              const rect =
                                clearTypeBadgeRef.current?.getBoundingClientRect()

                              if (!rect) {
                                return
                              }

                              setClearTypePickerPosition({
                                left: rect.right + 12,
                                top: rect.top,
                              })

                              setIsClearTypePickerOpen(true)
                            }}
                            disabled={isSaving}
                            className="relative rounded-full transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Change clear type"
                            aria-expanded={isClearTypePickerOpen}
                          >
                            <ClearTypeBadge
                              value={editedRow.clear_type}
                              rateType={editedRow.rate_type}
                              size={60}
                            />
                          </button>
                        ) : (
                          <ClearTypeBadge
                            value={row.clear_type}
                            rateType={row.rate_type}
                            size={60}
                          />
                        )}

                        <GradeBadge
                          grade={grade}
                          color={gradeColor}
                          size={60}
                        />

                        {isEditing &&
                          isClearTypePickerOpen &&
                          clearTypePickerPosition &&
                          createPortal(
                            <div
                              className="fixed z-100 border border-zinc-700 bg-[#070a10]/98 p-3 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-sm"
                              style={{
                                left: clearTypePickerPosition.left,
                                top: clearTypePickerPosition.top,
                              }}
                            >
                              <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                CLEAR TYPE
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                {clearTypeOptions.map((option) => (
                                  <button
                                    key={`${option.clearType}-${option.rateType ?? 'NONE'}`}
                                    type="button"
                                    onClick={() =>
                                      handleClearTypeChange(
                                        option.clearType,
                                        option.rateType,
                                      )
                                    }
                                    disabled={isSaving}
                                    className="flex h-16 w-16 items-center justify-center border border-transparent transition hover:border-fuchsia-400/50 hover:bg-fuchsia-400/5 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={
                                      option.rateType
                                        ? `${option.clearType} / ${option.rateType}`
                                        : option.clearType ?? 'None'
                                    }
                                  >
                                    <ClearTypeBadge
                                      value={option.clearType}
                                      rateType={option.rateType}
                                      size={52}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>,
                            document.body,
                          )
                        }
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="mt-5 border-t border-zinc-800 pt-4">
                      <div className="grid grid-cols-2 gap-8 sm:gap-12">
                        {/* SCORE */}
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                            SCORE
                          </div>

                          {isEditing ? (
                            <div className="mt-1 flex h-10 min-w-0 items-end gap-3 sm:h-10">
                              <input
                                type="number"
                                value={editedRow.score ?? ''}
                                onChange={(event) => {
                                  setEditedRow((current) => ({
                                    ...current,
                                    score:
                                      event.target.value === ''
                                        ? null
                                        : Number(event.target.value),
                                  }))
                                }}
                                className="h-10 min-w-0 flex-1 border border-fuchsia-400/50 bg-[#070a10] px-3 py-1 font-mono text-2xl font-black leading-none tabular-nums text-white outline-none focus:border-fuchsia-400 sm:text-3xl"
                              />

                              <input
                                type="number"
                                value={editedRow.score_delta ?? ''}
                                onChange={(event) => {
                                  setEditedRow((current) => ({
                                    ...current,
                                    score_delta:
                                      event.target.value === ''
                                        ? null
                                        : Number(event.target.value),
                                  }))
                                }}
                                placeholder="SCORE Δ"
                                className="h-10 w-28 shrink-0 border border-fuchsia-400/50 bg-[#070a10] px-3 py-1 font-mono text-base font-black leading-none tabular-nums text-zinc-200 outline-none focus:border-fuchsia-400 sm:w-32"
                              />
                            </div>
                          ) : (
                            <div className="mt-1 flex min-h-10 items-end gap-4">
                              <span className="font-mono text-3xl font-black tabular-nums leading-none text-white sm:text-4xl">
                                {formatScore(row.score) || '\u00A0'}
                              </span>

                              <span
                                className={`font-mono text-base font-black tabular-nums leading-none sm:text-lg ${getDeltaClass(row.score_delta)}`}
                              >
                                {formatDelta(row.score_delta) || '\u00A0'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* EX SCORE */}
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                            EX SCORE
                          </div>

                          {isEditing ? (
                            <div className="mt-1 flex h-10 min-w-0 items-end gap-3 sm:h-10">
                              <input
                                type="number"
                                value={editedRow.ex_score ?? ''}
                                onChange={(event) => {
                                  setEditedRow((current) => ({
                                    ...current,
                                    ex_score:
                                      event.target.value === ''
                                        ? null
                                        : Number(event.target.value),
                                  }))
                                }}
                                className="h-10 min-w-0 flex-1 border border-fuchsia-400/50 bg-[#070a10] px-3 py-1 font-mono text-2xl font-black leading-none tabular-nums text-zinc-200 outline-none focus:border-fuchsia-400 sm:text-3xl"
                              />

                              <input
                                type="number"
                                value={editedRow.ex_score_delta ?? ''}
                                onChange={(event) => {
                                  setEditedRow((current) => ({
                                    ...current,
                                    ex_score_delta:
                                      event.target.value === ''
                                        ? null
                                        : Number(event.target.value),
                                  }))
                                }}
                                placeholder="EX SCORE Δ"
                                className="h-10 w-28 shrink-0 border border-fuchsia-400/50 bg-[#070a10] px-3 py-1 font-mono text-base font-black leading-none tabular-nums text-zinc-200 outline-none focus:border-fuchsia-400 sm:w-32"
                              />
                            </div>
                          ) : (
                            <div className="mt-1 flex min-h-10 items-end gap-4">
                              <span className="font-mono text-2xl font-black tabular-nums leading-none text-zinc-200 sm:text-3xl">
                                {formatScore(row.ex_score) || '\u00A0'}
                              </span>

                              <span
                                className={`font-mono text-base font-black tabular-nums leading-none sm:text-lg ${getDeltaClass(row.ex_score_delta)}`}
                              >
                                {formatDelta(row.ex_score_delta) || '\u00A0'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <button
                type="button"
                disabled={!hasNext || isEditing}
                onClick={() => {
                  void onNavigate('next')
                }}
                className="w-12 shrink-0 border border-zinc-800 bg-[#060910]/95 font-mono text-xs font-bold tracking-widest text-zinc-500 transition hover:border-fuchsia-400/60 hover:text-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-20"
                aria-label="Next record"
              >
                NEXT
              </button>
            </div>

            {/* Media */}
            <section className="relative mt-7">
              <div className="mb-4 flex items-center gap-4">
                <span className="h-px w-10 bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.5)]" />

                <span className="font-mono text-sm font-black uppercase tracking-[0.28em] text-zinc-300">
                  MEDIA STREAM
                </span>

                <span className="h-px flex-1 bg-zinc-800" />

                <span className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 sm:block">
                  PLAYBACK DATA
                </span>
              </div>

              <div
                className={`grid gap-8 ${
                  media.resultImage && media.replayVideo
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {media.resultImage || !media.replayVideo ? (
                  <div
                    className={`group relative mx-auto w-full overflow-hidden border border-zinc-800 bg-[#05070c] transition-all hover:border-cyan-400/50 hover:shadow-[0_0_28px_rgba(34,211,238,0.08)] ${
                      media.replayVideo ? '' : 'max-w-150'
                    }`}
                  >
                    <div className="absolute left-0 top-0 h-px w-20 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 group-hover:w-full" />

                    <div className="flex items-center justify-between border-b border-zinc-800 bg-[#070a10] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.9)]" />
                        <span className="font-mono text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                          RESULT IMAGE
                        </span>
                      </div>

                      {media.resultImage && (
                        <button
                          type="button"
                          aria-label="Move result image to trash"
                          title="Move to Recycle Bin"
                          onClick={() => requestDeleteMedia('result')}
                          className="flex h-8 w-8 items-center justify-center border border-zinc-800 text-zinc-500 transition-colors hover:border-cyan-400/60 hover:text-cyan-300"
                        >
                          <Trash2 size={16} strokeWidth={1.8} />
                        </button>
                      )}
                    </div>

                    <div className="relative overflow-hidden bg-[#03050a] p-4 aspect-5/7">
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-size-[24px_24px]" />

                      {media.resultImage ? (
                        <button
                          type="button"
                          className="relative flex h-full w-full cursor-zoom-in items-center justify-center border border-zinc-800 bg-[#05070c]"
                          onClick={() => {
                            setImageZoom(1)
                            setImageOffset({ x: 0, y: 0 })
                            setIsImagePreviewOpen(true)
                          }}
                        >
                          <img
                            src={media.resultImage}
                            alt="Result"
                            className="h-full w-full object-contain"
                          />
                        </button>
                      ) : (
                        <div className="relative flex h-full items-center justify-center border border-dashed border-zinc-800 bg-[#05070c] font-mono text-sm font-bold uppercase tracking-[0.25em] text-zinc-700">
                          RESULT.PNG
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {media.replayVideo ? (
                  <div
                    className={`group relative mx-auto w-full overflow-hidden border border-zinc-800 bg-[#05070c] transition-all hover:border-fuchsia-400/50 hover:shadow-[0_0_28px_rgba(217,70,239,0.08)] ${
                      media.resultImage ? '' : 'max-w-150'
                    }`}
                  >
                    <div className="absolute left-0 top-0 h-px w-20 bg-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.8)] transition-all duration-500 group-hover:w-full" />

                    <div className="flex items-center justify-between border-b border-zinc-800 bg-[#070a10] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 bg-fuchsia-400 shadow-[0_0_7px_rgba(217,70,239,0.9)]" />
                        <span className="font-mono text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300">
                          REPLAY VIDEO
                        </span>
                      </div>

                      <button
                        type="button"
                        aria-label="Move replay video to trash"
                        title="Move to Recycle Bin"
                        onClick={() => requestDeleteMedia('replay')}
                        className="flex h-8 w-8 items-center justify-center border border-zinc-800 text-zinc-500 transition-colors hover:border-fuchsia-400/60 hover:text-fuchsia-300"
                      >
                        <Trash2 size={16} strokeWidth={1.8} />
                      </button>
                    </div>

                    <div className="relative overflow-hidden bg-[#03050a] p-4 aspect-5/7">
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(217,70,239,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.07)_1px,transparent_1px)] bg-size-[24px_24px]" />

                      <div className="relative flex h-full items-center justify-center border border-zinc-800 bg-[#05070c]">
                        <video
                          ref={videoRef}
                          src={media.replayVideo}
                          controls
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

            </section>
            {isImagePreviewOpen && media.resultImage
              ? createPortal(
                  <div
                    className="fixed inset-0 z-100 flex h-screen w-screen items-center justify-center overflow-hidden bg-black/80"
                    onClick={(event) => {
                      if (event.target === event.currentTarget) {
                        setIsImagePreviewOpen(false)
                      }
                    }}
                    onWheel={(event) => {
                      event.preventDefault()
                      event.stopPropagation()

                      const rect =
                        event.currentTarget.getBoundingClientRect()

                      const cursorX =
                        event.clientX - rect.left - rect.width / 2
                      const cursorY =
                        event.clientY - rect.top - rect.height / 2

                      const oldZoom = imageZoom

                      const newZoom = Math.min(
                        4,
                        Math.max(
                          0.5,
                          oldZoom +
                            (event.deltaY < 0 ? 0.1 : -0.1),
                        ),
                      )

                      if (newZoom === oldZoom) return

                      const zoomRatio = newZoom / oldZoom

                      setImageOffset((current) => ({
                        x:
                          cursorX -
                          (cursorX - current.x) * zoomRatio,
                        y:
                          cursorY -
                          (cursorY - current.y) * zoomRatio,
                      }))

                      setImageZoom(newZoom)
                    }}
                  >
                    {/* CLOSE */}
                    <button
                      type="button"
                      className="absolute right-6 top-6 z-30 flex h-10 w-10 items-center justify-center border border-zinc-700 bg-[#070a10] font-mono text-xl text-zinc-300 transition hover:border-cyan-400 hover:text-cyan-300"
                      onClick={() => {
                        setIsImagePreviewOpen(false)
                      }}
                      aria-label="Close preview"
                    >
                      ×
                    </button>

                    {/* IMAGE AREA */}
                    <div
                      className="relative flex items-center justify-center"
                      onClick={(event) => {
                        event.stopPropagation()
                      }}
                    >
                      <img
                        src={media.resultImage}
                        alt="Result preview"
                        draggable={false}
                        className={`max-h-[90vh] max-w-[90vw] object-contain ${
                          isDraggingImage
                            ? 'cursor-grabbing'
                            : 'cursor-grab'
                        }`}
                        onPointerDown={(event) => {
                          if (event.button !== 0) return

                          dragStartRef.current = {
                            x: event.clientX,
                            y: event.clientY,
                          }

                          offsetStartRef.current = imageOffset

                          event.currentTarget.setPointerCapture(
                            event.pointerId,
                          )

                          setIsDraggingImage(false)
                        }}
                        onPointerMove={(event) => {
                          if (
                            !event.currentTarget.hasPointerCapture(
                              event.pointerId,
                            )
                          ) {
                            return
                          }

                          const deltaX =
                            event.clientX -
                            dragStartRef.current.x

                          const deltaY =
                            event.clientY -
                            dragStartRef.current.y

                          // クリックだけではドラッグ開始しない
                          if (
                            !isDraggingImage &&
                            Math.abs(deltaX) < 5 &&
                            Math.abs(deltaY) < 5
                          ) {
                            return
                          }

                          setIsDraggingImage(true)

                          setImageOffset({
                            x:
                              offsetStartRef.current.x +
                              deltaX,
                            y:
                              offsetStartRef.current.y +
                              deltaY,
                          })
                        }}
                        onPointerUp={(event) => {
                          setIsDraggingImage(false)

                          if (
                            event.currentTarget.hasPointerCapture(
                              event.pointerId,
                            )
                          ) {
                            event.currentTarget.releasePointerCapture(
                              event.pointerId,
                            )
                          }
                        }}
                        onPointerCancel={(event) => {
                          setIsDraggingImage(false)

                          if (
                            event.currentTarget.hasPointerCapture(
                              event.pointerId,
                            )
                          ) {
                            event.currentTarget.releasePointerCapture(
                              event.pointerId,
                            )
                          }
                        }}
                        style={{
                          transform: `translate3d(${imageOffset.x}px, ${imageOffset.y}px, 0) scale(${imageZoom})`,
                          transformOrigin: 'center center',
                        }}
                      />

                      {/* CONTROLS */}
                      <div
                        className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 border border-zinc-700 bg-[#070a10]/95 p-2"
                        onPointerDown={(event) => {
                          event.stopPropagation()
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                        }}
                      >
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center border border-zinc-700 font-mono text-lg text-zinc-300 hover:border-cyan-400 hover:text-cyan-300"
                          onClick={() => {
                            const newZoom = Math.max(
                              0.5,
                              imageZoom - 0.2,
                            )

                            setImageZoom(newZoom)

                            if (newZoom === 1) {
                              setImageOffset({
                                x: 0,
                                y: 0,
                              })
                            }
                          }}
                        >
                          −
                        </button>

                        <span className="min-w-14 text-center font-mono text-xs text-zinc-400">
                          {Math.round(imageZoom * 100)}%
                        </span>

                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center border border-zinc-700 font-mono text-lg text-zinc-300 hover:border-cyan-400 hover:text-cyan-300"
                          onClick={() => {
                            setImageZoom((current) =>
                              Math.min(4, current + 0.2),
                            )
                          }}
                        >
                          +
                        </button>

                        <button
                          type="button"
                          className="ml-2 border-l border-zinc-700 px-3 font-mono text-xs text-zinc-500 hover:text-cyan-300"
                          onClick={() => {
                            setImageZoom(1)
                            setImageOffset({
                              x: 0,
                              y: 0,
                            })
                          }}
                        >
                          RESET
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )
              : null}
              {deleteTarget &&
                createPortal(
                  <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
                    <div className="w-full max-w-md border border-zinc-700 bg-[#070a10] shadow-2xl">
                      <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
                        <Trash2
                          size={18}
                          className={
                            deleteTarget === 'result'
                              ? 'text-cyan-300'
                              : 'text-fuchsia-300'
                          }
                        />

                        <span className="font-mono text-sm tracking-[0.18em] text-zinc-200">
                          MOVE TO TRASH
                        </span>
                      </div>

                      <div className="px-6 py-6">
                        <p className="font-mono text-sm text-zinc-200">
                          {deleteTarget === 'result'
                            ? 'RESULT IMAGE'
                            : 'REPLAY VIDEO'}
                        </p>

                        <p className="mt-3 text-sm leading-6 text-zinc-400">
                          このメディアをWindowsのゴミ箱へ移動しますか？
                        </p>

                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                          プレイ記録自体は削除されません。
                        </p>

                        {mediaDeleteError && (
                          <p className="mt-4 border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                            {mediaDeleteError}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">
                        <button
                          type="button"
                          disabled={isDeletingMedia}
                          onClick={() => {
                            setDeleteTarget(null)
                            setMediaDeleteError(null)
                          }}
                          className="border border-zinc-800 px-4 py-2 font-mono text-xs tracking-[0.12em] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          CANCEL
                        </button>

                        <button
                          type="button"
                          disabled={isDeletingMedia}
                          onClick={handleDeleteMedia}
                          className={
                            deleteTarget === 'result'
                              ? 'border border-cyan-400/50 bg-cyan-400/5 px-4 py-2 font-mono text-xs tracking-[0.12em] text-cyan-300 transition-colors hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40'
                              : 'border border-fuchsia-400/50 bg-fuchsia-400/5 px-4 py-2 font-mono text-xs tracking-[0.12em] text-fuchsia-300 transition-colors hover:bg-fuchsia-400/10 disabled:cursor-not-allowed disabled:opacity-40'
                          }
                        >
                          {isDeletingMedia ? 'MOVING...' : 'MOVE TO TRASH'}
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}
                {isRecordDeleteConfirmOpen &&
                  createPortal(
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
                      <div className="w-full max-w-md border border-zinc-700 bg-[#070a10] shadow-2xl">
                        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
                          <Trash2
                            size={18}
                            className="text-red-300"
                          />

                          <span className="font-mono text-sm tracking-[0.18em] text-zinc-200">
                            DELETE PLAY RECORD
                          </span>
                        </div>

                        <div className="px-6 py-6">
                          <p className="font-mono text-sm text-zinc-200">
                            {row.song_name ?? 'UNKNOWN SONG'}
                          </p>

                          <p className="mt-3 text-sm leading-6 text-zinc-400">
                            このプレイ記録を削除しますか？
                          </p>

                          <p className="mt-2 text-xs leading-5 text-zinc-600">
                            プレイ記録をデータベースから削除し、
                            関連するメディアもWindowsのゴミ箱へ移動します。
                          </p>

                          {recordDeleteError && (
                            <p className="mt-4 border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                              {recordDeleteError}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">
                          <button
                            type="button"
                            disabled={isDeletingRecord}
                            onClick={() => {
                              setIsRecordDeleteConfirmOpen(false)
                              setRecordDeleteError(null)
                            }}
                            className="border border-zinc-800 px-4 py-2 font-mono text-xs tracking-[0.12em] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            CANCEL
                          </button>

                          <button
                            type="button"
                            disabled={isDeletingRecord}
                            onClick={handleDeleteRecord}
                            className="border border-red-400/50 bg-red-400/5 px-4 py-2 font-mono text-xs tracking-[0.12em] text-red-300 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isDeletingRecord
                              ? 'DELETING...'
                              : 'DELETE'}
                          </button>
                        </div>
                      </div>
                    </div>,
                    document.body,
                  )}
          </main>

          <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-px bg-linear-to-r from-cyan-400/40 via-zinc-800 to-fuchsia-400/40" />
        </div>
      </div>
    </>
  )
}
