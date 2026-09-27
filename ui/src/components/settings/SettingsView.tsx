import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  AlertTriangle,
  FolderOpen,
  Keyboard,
  PlayCircle,
  RotateCcw,
  Save,
  ScanLine,
} from 'lucide-react'

import { SystemBackground } from '../effects/SystemBackground'
import { SystemPageHeader } from '../layout/SystemPageHeader'
import { SystemSidebar } from '../layout/SystemSidebar'
import { LogTerminal } from '../log/LogTerminal'
import { MessageDialog } from '../common/MessageDialog'
import {
  RoiEditor,
  type RoiItem,
  type RoiRegion,
} from './RoiEditor'

const LOG_LEVELS = [
  'DEBUG',
  'INFO',
  'WARNING',
  'ERROR',
  'CRITICAL',
] as const

type LogLevel = (typeof LOG_LEVELS)[number]

type Region = RoiRegion

type Config = {
  logging: {
    level: string
  }
  input: {
    trigger_key: string
  }
  obs: {
    executable_path: string
    websocket: {
      host: string
      port: number
      timeout_seconds: number
    }
    scene_name: string
  }
  result_detection: {
    threshold: number
    interval_seconds: number
    scale: number
    region: Region
  }
  song_start_detection: {
    threshold: number
    interval_seconds: number
    scale: number
    region: Region
  }
  ocr: {
    regions: {
      song_name: Region
      artist: Region
      difficulty_level: Region
      clear_type: Region
      rate_type: Region
      score: Region
      score_delta: Region
      ex_score: Region
      ex_score_delta: Region
    }
  }
  play_log: {
    min_score: number
  }
}

type SettingsViewProps = {
  onBack: () => void
}

type SettingsTab =
  | 'main'
  | 'advanced'
  | 'screen_areas'

type RoiSubTab =
  | 'result'
  | 'song_start'

type SettingsSnapshot = {
  config: Config
  resultSample: string
  songStartSample: string
}

type RoiSnapshot = {
  resultDetection: Region
  songStartDetection: Region
  ocr: Config['ocr']['regions']
}

const RESULT_ROIS = [
  {
    id: 'song_name',
    label: 'SONG NAME',
  },
  {
    id: 'artist',
    label: 'ARTIST',
  },
  {
    id: 'difficulty_level',
    label: 'DIFFICULTY / LEVEL',
  },
  {
    id: 'clear_type',
    label: 'CLEAR TYPE',
  },
  {
    id: 'rate_type',
    label: 'RATE TYPE',
  },
  {
    id: 'score',
    label: 'SCORE',
  },
  {
    id: 'score_delta',
    label: 'SCORE DELTA',
  },
  {
    id: 'ex_score',
    label: 'EX SCORE',
  },
  {
    id: 'ex_score_delta',
    label: 'EX SCORE DELTA',
  },
] as const

function cloneConfig(
  config: Config,
): Config {
  return structuredClone(config)
}

function cloneSnapshot(
  snapshot: SettingsSnapshot,
): SettingsSnapshot {
  return {
    config: cloneConfig(snapshot.config),
    resultSample: snapshot.resultSample,
    songStartSample:
      snapshot.songStartSample,
  }
}

function snapshotsEqual(
  a: SettingsSnapshot | null,
  b: SettingsSnapshot | null,
): boolean {
  if (!a || !b) {
    return false
  }

  return (
    JSON.stringify(a.config) ===
      JSON.stringify(b.config) &&
    a.resultSample === b.resultSample &&
    a.songStartSample ===
      b.songStartSample
  )
}

function NumberInput({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) =>
        onChange(
          Number(event.target.value),
        )
      }
      className="w-full border border-zinc-800 bg-[#05080d] px-3.5 py-3 font-mono text-sm text-zinc-200 outline-none transition focus:border-cyan-400/60"
    />
  )
}

function TextInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="w-full border border-zinc-800 bg-[#05080d] px-3.5 py-3 font-mono text-sm text-zinc-200 outline-none transition focus:border-cyan-400/60"
    />
  )
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="w-full border border-zinc-800 bg-[#05080d] px-3.5 py-3 font-mono text-sm text-zinc-200 outline-none transition focus:border-cyan-400/60"
    >
      {options.map((option) => (
        <option
          key={option}
          value={option}
        >
          {option}
        </option>
      ))}
    </select>
  )
}

function SettingLabel({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
      {children}
    </span>
  )
}

function SettingHint({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="font-mono text-[11px] leading-relaxed tracking-[0.04em] text-zinc-500">
      {children}
    </p>
  )
}

function SettingCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-zinc-900 bg-[#05080d]/80">
      <div className="border-b border-zinc-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-6 bg-cyan-400" />

          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-zinc-300">
            {title}
          </h2>
        </div>

        {description && (
          <p className="mt-2 pl-9 font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-600">
            {description}
          </p>
        )}
      </div>

      <div className="p-6">
        {children}
      </div>
    </section>
  )
}

function PathInput({
  value,
  onBrowse,
}: {
  value: string
  onBrowse: () => void
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        readOnly
        className="min-w-0 flex-1 border border-zinc-800 bg-[#05080d] px-3 py-2.5 font-mono text-xs text-zinc-300 outline-none"
      />

      <button
        type="button"
        onClick={onBrowse}
        className="group relative flex shrink-0 items-center gap-2 border border-zinc-800 bg-[#070a10] px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 transition hover:border-cyan-400/60 hover:text-cyan-300"
      >
        <span className="absolute left-0 top-0 h-px w-4 bg-cyan-400 transition-all group-hover:w-full" />

        <FolderOpen
          size={16}
          strokeWidth={1.8}
        />

        BROWSE
      </button>
    </div>
  )
}

function KeyInput({
  value,
  listening,
  onStart,
}: {
  value: string
  listening: boolean
  onStart: () => void
}) {
  return (
    <div className="flex gap-2">
      <div
        className={`flex min-w-0 flex-1 items-center border px-3.5 py-3 font-mono text-sm ${
          listening
            ? 'border-cyan-400/70 bg-cyan-400/5 text-cyan-300'
            : 'border-zinc-800 bg-[#05080d] text-zinc-300'
        }`}
      >
        <Keyboard
          size={16}
          strokeWidth={1.8}
          className="mr-2 shrink-0 text-zinc-600"
        />

        <span>
          {listening
            ? 'PRESS A KEY...'
            : value}
        </span>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={listening}
        className="group relative shrink-0 border border-zinc-800 bg-[#070a10] px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 transition hover:border-cyan-400/60 hover:text-cyan-300 disabled:cursor-wait disabled:border-cyan-400/40 disabled:text-cyan-300"
      >
        <span className="absolute left-0 top-0 h-px w-4 bg-cyan-400 transition-all group-hover:w-full" />

        {listening
          ? 'WAITING...'
          : 'SET KEY'}
      </button>
    </div>
  )
}

function TabButton({
  active,
  label,
  index,
  onClick,
}: {
  active: boolean
  label: string
  index: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-w-0 flex-1 items-center justify-center gap-3 border px-4 py-3 font-mono transition ${
        active
          ? 'border-cyan-400/50 bg-cyan-400/5 text-cyan-300'
          : 'border-zinc-900 bg-[#05080d] text-zinc-600 hover:border-zinc-700 hover:text-zinc-300'
      }`}
    >
      <span
        className={`text-[11px] font-bold tracking-[0.16em] ${
          active
            ? 'text-cyan-400'
            : 'text-zinc-700'
        }`}
      >
        {index}
      </span>

      <span className="text-xs font-bold uppercase tracking-[0.2em]">
        {label}
      </span>

      {active && (
        <span className="absolute bottom-0 left-0 h-px w-full bg-cyan-400" />
      )}
    </button>
  )
}

function RoiSubTabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex min-w-0 flex-1 items-center justify-center gap-2',
        'h-8 border-b-2 px-4',
        'font-mono text-[12px] font-bold uppercase tracking-[0.14em]',
        'transition-colors',
        active
          ? 'border-cyan-400 bg-cyan-400/5 text-cyan-300'
          : 'border-transparent text-zinc-600 hover:bg-zinc-900/40 hover:text-zinc-400',
      ].join(' ')}
    >
      <span className="flex translate-y-px items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  )
}

function normalizeImage(
  source: string,
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image()

      image.onload = () => {
        const canvas =
          document.createElement(
            'canvas',
          )

        canvas.width = 1080
        canvas.height = 1920

        const context =
          canvas.getContext('2d')

        if (!context) {
          reject(
            new Error(
              'Canvas contextを取得できませんでした。',
            ),
          )
          return
        }

        context.drawImage(
          image,
          0,
          0,
          1080,
          1920,
        )

        resolve(
          canvas.toDataURL(
            'image/png',
          ),
        )
      }

      image.onerror = () => {
        reject(
          new Error(
            'PNG画像を読み込めませんでした。',
          ),
        )
      }

      image.src = source
    },
  )
}

function cropImage(
  source: string,
  region: Region,
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image()

      image.onload = () => {
        const canvas =
          document.createElement(
            'canvas',
          )

        canvas.width =
          region.width
        canvas.height =
          region.height

        const context =
          canvas.getContext('2d')

        if (!context) {
          reject(
            new Error(
              'Canvas contextを取得できませんでした。',
            ),
          )
          return
        }

        context.drawImage(
          image,
          region.x,
          region.y,
          region.width,
          region.height,
          0,
          0,
          region.width,
          region.height,
        )

        resolve(
          canvas.toDataURL(
            'image/png',
          ),
        )
      }

      image.onerror = () => {
        reject(
          new Error(
            'Template生成用画像を読み込めませんでした。',
          ),
        )
      }

      image.src = source
    },
  )
}

function clampRegion(
  region: Region,
): Region {
  let width = Math.round(
    region.width,
  )

  let height = Math.round(
    region.height,
  )

  width = Math.max(
    20,
    Math.min(1080, width),
  )

  height = Math.max(
    20,
    Math.min(1920, height),
  )

  let x = Math.round(region.x)
  let y = Math.round(region.y)

  x = Math.max(
    0,
    Math.min(1080 - width, x),
  )

  y = Math.max(
    0,
    Math.min(1920 - height, y),
  )

  return {
    x,
    y,
    width,
    height,
  }
}

function RoiNumberInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="space-y-1">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">
        {label}
      </span>

      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(event) => {
          const parsed =
            Number(
              event.target.value,
            )

          if (
            Number.isFinite(parsed)
          ) {
            onChange(
              Math.round(parsed),
            )
          }
        }}
        className="w-full border border-zinc-800 bg-[#05080d] px-2.5 py-2 font-mono text-xs text-zinc-300 outline-none transition focus:border-cyan-400/60"
      />
    </label>
  )
}

function RoiList({
  items,
  selectedId,
  onSelect,
  onChange,
}: {
  items: RoiItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (
    id: string,
    region: Region,
  ) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const selected =
          item.id === selectedId

        return (
          <div
            key={item.id}
            className={`border p-3 transition ${
              selected
                ? 'border-cyan-400/50 bg-cyan-400/5'
                : 'border-zinc-900 bg-[#060910]'
            }`}
          >
            <button
              type="button"
              onClick={() =>
                onSelect(item.id)
              }
              className="mb-3 flex w-full items-center gap-2 text-left"
            >
              <span
                className={`h-1.5 w-1.5 ${
                  selected
                    ? 'bg-cyan-300'
                    : 'bg-zinc-700'
                }`}
              />

              <span
                className={`font-mono text-[11px] font-bold uppercase tracking-[0.16em] ${
                  selected
                    ? 'text-cyan-300'
                    : 'text-zinc-500'
                }`}
              >
                {item.label}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <RoiNumberInput
                label="X"
                value={item.region.x}
                onChange={(value) =>
                  onChange(
                    item.id,
                    clampRegion({
                      ...item.region,
                      x: value,
                    }),
                  )
                }
              />

              <RoiNumberInput
                label="Y"
                value={item.region.y}
                onChange={(value) =>
                  onChange(
                    item.id,
                    clampRegion({
                      ...item.region,
                      y: value,
                    }),
                  )
                }
              />

              <RoiNumberInput
                label="W"
                value={item.region.width}
                onChange={(value) =>
                  onChange(
                    item.id,
                    clampRegion({
                      ...item.region,
                      width: value,
                    }),
                  )
                }
              />

              <RoiNumberInput
                label="H"
                value={item.region.height}
                onChange={(value) =>
                  onChange(
                    item.id,
                    clampRegion({
                      ...item.region,
                      height: value,
                    }),
                  )
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SettingsView({
  onBack,
}: SettingsViewProps) {
  const [config, setConfig] =
    useState<Config | null>(null)

  const [
    defaultConfig,
    setDefaultConfig,
  ] = useState<Config | null>(null)

  const [
    resultSample,
    setResultSample,
  ] = useState<string | null>(null)

  const [
    songStartSample,
    setSongStartSample,
  ] = useState<string | null>(null)

  const [
    resultDefault,
    setResultDefault,
  ] = useState<string | null>(null)

  const [
    songStartDefault,
    setSongStartDefault,
  ] = useState<string | null>(null)

  const [
    savedSnapshot,
    setSavedSnapshot,
  ] = useState<SettingsSnapshot | null>(
    null,
  )

  type SettingsDialog =
    | { type: 'unsaved-close' }
    | {
        type: 'unsaved-tab'
        nextTab: SettingsTab
      }
    | { type: 'reset-main' }
    | { type: 'reset-advanced' }
    | { type: 'reset-roi' }
    | null

  const [settingsDialog, setSettingsDialog] =
    useState<SettingsDialog>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [activeTab, setActiveTab] =
    useState<SettingsTab>('main')

  const [roiSubTab, setRoiSubTab] =
    useState<RoiSubTab>('result')

  const [
    selectedRoiId,
    setSelectedRoiId,
  ] = useState<string | null>(null)

  const [roiUndoStack, setRoiUndoStack] =
    useState<RoiSnapshot[]>([])

  const [roiRedoStack, setRoiRedoStack] =
    useState<RoiSnapshot[]>([])

  const roiEditActiveRef =
    useRef(false)

  const [
    listeningForKey,
    setListeningForKey,
  ] = useState(false)

  const [
    showLogTerminal,
    setShowLogTerminal,
  ] = useState(false)

  const isDirty =
    config !== null &&
    resultSample !== null &&
    songStartSample !== null &&
    savedSnapshot !== null &&
    !snapshotsEqual(
      {
        config,
        resultSample,
        songStartSample,
      },
      savedSnapshot,
    )

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const resources =
          await window.api.getSettingsResources()

        if (cancelled) {
          return
        }

        const loadedConfig =
          resources.config as Config

        const loadedDefaultConfig =
          resources.defaultConfig as Config

        const normalizedResult =
          await normalizeImage(
            resources.resultSample,
          )

        const normalizedSongStart =
          await normalizeImage(
            resources.songStartSample,
          )

        const normalizedResultDefault =
          await normalizeImage(
            resources.resultDefault,
          )

        const normalizedSongStartDefault =
          await normalizeImage(
            resources.songStartDefault,
          )

        const snapshot: SettingsSnapshot = {
          config: loadedConfig,
          resultSample:
            normalizedResult,
          songStartSample:
            normalizedSongStart,
        }

        setConfig(
          cloneConfig(loadedConfig),
        )

        setDefaultConfig(
          cloneConfig(
            loadedDefaultConfig,
          ),
        )

        setResultSample(
          normalizedResult,
        )

        setSongStartSample(
          normalizedSongStart,
        )

        setResultDefault(
          normalizedResultDefault,
        )

        setSongStartDefault(
          normalizedSongStartDefault,
        )

        setSavedSnapshot(
          cloneSnapshot(snapshot),
        )
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '設定の読み込みに失敗しました。',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!listeningForKey) {
      return
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      event.preventDefault()
      event.stopPropagation()

      if (
        event.key === 'Escape'
      ) {
        setListeningForKey(false)
        return
      }

      let key = event.key

      if (key === ' ') {
        key = 'space'
      }

      key = key.toLowerCase()

      setConfig((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          input: {
            ...current.input,
            trigger_key: key,
          },
        }
      })

      setListeningForKey(false)
      setMessage(null)
      setError(null)
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [listeningForKey])

  const updateConfig = (
    updater: (
      current: Config,
    ) => Config,
  ) => {
    setConfig((current) => {
      if (!current) {
        return current
      }

      return updater(current)
    })

    setMessage(null)
    setError(null)
  }

  const getRoiSnapshot = (): RoiSnapshot | null => {
    if (!config) {
      return null
    }

    return {
      resultDetection:
        structuredClone(
          config.result_detection.region,
        ),
      songStartDetection:
        structuredClone(
          config.song_start_detection.region,
        ),
      ocr: structuredClone(
        config.ocr.regions,
      ),
    }
  }

  const pushRoiHistory = () => {
    const snapshot =
      getRoiSnapshot()

    if (!snapshot) {
      return
    }

    setRoiUndoStack((current) => [
      ...current,
      snapshot,
    ])

    setRoiRedoStack([])
  }

  const updateRoi = (
    id: string,
    region: Region,
  ) => {
    if (!roiEditActiveRef.current) {
      pushRoiHistory()
    }

    updateConfig((current) => {
      if (
        id === 'result_detection'
      ) {
        return {
          ...current,
          result_detection: {
            ...current.result_detection,
            region,
          },
        }
      }

      if (
        id === 'song_start_detection'
      ) {
        return {
          ...current,
          song_start_detection: {
            ...current.song_start_detection,
            region,
          },
        }
      }

      return {
        ...current,
        ocr: {
          ...current.ocr,
          regions: {
            ...current.ocr.regions,
            [id]: region,
          },
        },
      }
    })

    setSelectedRoiId(id)
  }

  useEffect(() => {
    if (activeTab !== 'screen_areas') {
      return
    }

    const getRoiSnapshot = (): RoiSnapshot | null => {
      if (!config) {
        return null
      }

      return {
        resultDetection: structuredClone(
          config.result_detection.region,
        ),
        songStartDetection: structuredClone(
          config.song_start_detection.region,
        ),
        ocr: structuredClone(
          config.ocr.regions,
        ),
      }
    }

    const applyRoiSnapshot = (
      snapshot: RoiSnapshot,
    ) => {
      setConfig((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          result_detection: {
            ...current.result_detection,
            region: structuredClone(
              snapshot.resultDetection,
            ),
          },
          song_start_detection: {
            ...current.song_start_detection,
            region: structuredClone(
              snapshot.songStartDetection,
            ),
          },
          ocr: {
            ...current.ocr,
            regions: structuredClone(
              snapshot.ocr,
            ),
          },
        }
      })

      setMessage(null)
      setError(null)
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        !event.ctrlKey ||
        event.altKey ||
        event.metaKey
      ) {
        return
      }

      if (
        event.key.toLowerCase() === 'z'
      ) {
        event.preventDefault()
        event.stopPropagation()

        if (roiUndoStack.length === 0) {
          return
        }

        const current = getRoiSnapshot()

        if (!current) {
          return
        }

        const previous =
          roiUndoStack[
            roiUndoStack.length - 1
          ]

        setRoiUndoStack(
          (stack) => stack.slice(0, -1),
        )

        setRoiRedoStack(
          (stack) => [
            ...stack,
            current,
          ],
        )

        applyRoiSnapshot(previous)
        return
      }

      if (
        event.key.toLowerCase() === 'y'
      ) {
        event.preventDefault()
        event.stopPropagation()

        if (roiRedoStack.length === 0) {
          return
        }

        const current = getRoiSnapshot()

        if (!current) {
          return
        }

        const next =
          roiRedoStack[
            roiRedoStack.length - 1
          ]

        setRoiRedoStack(
          (stack) => stack.slice(0, -1),
        )

        setRoiUndoStack(
          (stack) => [
            ...stack,
            current,
          ],
        )

        applyRoiSnapshot(next)
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    activeTab,
    config,
    roiUndoStack,
    roiRedoStack,
  ])

  const getResultRoiItems =
    (): RoiItem[] => {
      if (!config) {
        return []
      }

      return [
        {
          id: 'result_detection',
          label: 'RESULT DETECTION',
          region:
            config.result_detection
              .region,
        },
        ...RESULT_ROIS.map(
          (roi) => ({
            id: roi.id,
            label: roi.label,
            region:
              config.ocr.regions[
                roi.id
              ],
          }),
        ),
      ]
    }

  const getSongStartRoiItems =
    (): RoiItem[] => {
      if (!config) {
        return []
      }

      return [
        {
          id:
            'song_start_detection',
          label: 'SONG START DETECTION',
          region:
            config
              .song_start_detection
              .region,
        },
      ]
    }

  const browseFile = async (
    currentPath: string,
    extensions?: string[],
  ) => {
    try {
      const selectedPath =
        await window.api.selectFile({
          defaultPath: currentPath,
          extensions,
        })

      if (selectedPath) {
        updateConfig((current) => ({
          ...current,
          obs: {
            ...current.obs,
            executable_path:
              selectedPath.replace(
                /\\/g,
                '/',
              ),
          },
        }))
      }
    } catch (browseError) {
      setError(
        browseError instanceof Error
          ? browseError.message
          : 'ファイル選択に失敗しました。',
      )
    }
  }

  const chooseSample = async (
    type: RoiSubTab,
  ) => {
    try {
      const selected =
        await window.api.selectPngImage()

      if (!selected) {
        return
      }

      const normalized =
        await normalizeImage(
          selected,
        )

      if (
        type === 'result'
      ) {
        setResultSample(
          normalized,
        )
      } else {
        setSongStartSample(
          normalized,
        )
      }

      setMessage(null)
      setError(null)
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : '画像の読み込みに失敗しました。',
      )
    }
  }

  const performSave = async (): Promise<boolean> => {
    if (
      !config ||
      !resultSample ||
      !songStartSample
    ) {
      return false
    }

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const resultTemplate =
        await cropImage(
          resultSample,
          config.result_detection
            .region,
        )

      const songStartTemplate =
        await cropImage(
          songStartSample,
          config
            .song_start_detection
            .region,
        )

      await window.api.saveSettings({
        config,
        resultSample,
        songStartSample,
        resultTemplate,
        songStartTemplate,
      })

      const snapshot: SettingsSnapshot = {
        config: cloneConfig(config),
        resultSample,
        songStartSample,
      }

      setSavedSnapshot(
        cloneSnapshot(snapshot),
      )

      setMessage(
        '設定を保存しました。変更はバックエンド再起動後に反映されます。',
      )

      return true
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : '設定の保存に失敗しました。',
      )

      return false
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    await performSave()
  }

  const discardChanges = () => {
    if (!savedSnapshot) {
      return
    }

    const snapshot =
      cloneSnapshot(
        savedSnapshot,
      )

    setConfig(snapshot.config)
    setResultSample(
      snapshot.resultSample,
    )
    setSongStartSample(
      snapshot.songStartSample,
    )

    setSelectedRoiId(null)
    setMessage(null)
    setError(null)
  }

  const requestClose = () => {
    if (!isDirty) {
      onBack()
      return
    }

    setSettingsDialog({
      type: 'unsaved-close',
    })
  }

  const requestTabChange = (
    nextTab: SettingsTab,
  ) => {
    if (nextTab === activeTab) {
      return
    }

    if (!isDirty) {
      setActiveTab(nextTab)
      return
    }

    setSettingsDialog({
      type: 'unsaved-tab',
      nextTab,
    })
  }

  const resetMain = () => {
    if (!config || !defaultConfig) {
      return
    }

    setSettingsDialog({
      type: 'reset-main',
    })
  }

  const handleResetMain = () => {
    setSettingsDialog(null)

    setConfig((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        logging:
          cloneConfig(
            defaultConfig!,
          ).logging,
        input:
          cloneConfig(
            defaultConfig!,
          ).input,
        play_log:
          cloneConfig(
            defaultConfig!,
          ).play_log,
        obs: {
          ...current.obs,
          executable_path:
            defaultConfig!.obs
              .executable_path,
          scene_name:
            defaultConfig!.obs
              .scene_name,
        },
      }
    })

    setMessage(null)
    setError(null)
  }

  const resetAdvanced = () => {
    if (!config || !defaultConfig) {
      return
    }

    setSettingsDialog({
      type: 'reset-advanced',
    })
  }

  const handleResetAdvanced = () => {
    setSettingsDialog(null)

    setConfig((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        obs: {
          ...current.obs,
          websocket:
            cloneConfig(
              defaultConfig!,
            ).obs.websocket,
        },
        result_detection: {
          ...current.result_detection,
          threshold:
            defaultConfig!
              .result_detection
              .threshold,
          interval_seconds:
            defaultConfig!
              .result_detection
              .interval_seconds,
          scale:
            defaultConfig!
              .result_detection
              .scale,
        },
        song_start_detection: {
          ...current.song_start_detection,
          threshold:
            defaultConfig!
              .song_start_detection
              .threshold,
          interval_seconds:
            defaultConfig!
              .song_start_detection
              .interval_seconds,
          scale:
            defaultConfig!
              .song_start_detection
              .scale,
        },
      }
    })

    setMessage(null)
    setError(null)
  }

  const resetRoi = () => {
    if (!config || !defaultConfig) {
      return
    }

    setSettingsDialog({
      type: 'reset-roi',
    })
  }

  const handleResetRoi = () => {
    setSettingsDialog(null)

    const defaults =
      cloneConfig(defaultConfig!)

    setConfig((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        result_detection: {
          ...current.result_detection,
          region:
            defaults.result_detection
              .region,
        },
        song_start_detection: {
          ...current.song_start_detection,
          region:
            defaults.song_start_detection
              .region,
        },
        ocr: {
          ...current.ocr,
          regions:
            defaults.ocr.regions,
        },
      }
    })

    if (resultDefault) {
      setResultSample(resultDefault)
    }

    if (songStartDefault) {
      setSongStartSample(
        songStartDefault,
      )
    }

    setSelectedRoiId(null)
    setMessage(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="relative flex h-screen flex-col overflow-hidden bg-[#03050a] text-zinc-100">
        <SystemSidebar
          onSettings={() => undefined}
          onTerminal={() =>
            setShowLogTerminal(
              (open) => !open,
            )
          }
          terminalOpen={
            showLogTerminal
          }
          section={{
            index: '00',
            label: 'SETTINGS',
          }}
        />

        <main className="relative min-h-0 flex-1 overflow-y-auto lg:pl-18">
          <SystemBackground />

          <div className="relative">
            <SystemPageHeader
              label="SETTINGS"
              onBack={
                requestClose
              }
            />

            <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
              <span className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                LOADING SETTINGS...
              </span>
            </div>
          </div>
        </main>

        {showLogTerminal && (
          <LogTerminal
            onClose={() =>
              setShowLogTerminal(false)
            }
          />
        )}
      </div>
    )
  }

  if (!config) {
    return (
      <div className="relative flex h-screen flex-col overflow-hidden bg-[#03050a] text-zinc-100">
        <SystemSidebar
          onSettings={() => undefined}
          onTerminal={() =>
            setShowLogTerminal(
              (open) => !open,
            )
          }
          terminalOpen={
            showLogTerminal
          }
          section={{
            index: '00',
            label: 'SETTINGS',
          }}
        />

        <main className="relative min-h-0 flex-1 overflow-y-auto lg:pl-18">
          <SystemBackground />

          <div className="relative">
            <SystemPageHeader
              label="SETTINGS"
              onBack={
                requestClose
              }
            />

            <div className="mx-auto max-w-5xl px-6 py-6">
              <div className="border border-red-500/20 bg-red-500/5 p-6">
                <span className="font-mono text-xs text-red-300">
                  {error ??
                    '設定を読み込めませんでした。'}
                </span>
              </div>
            </div>
          </div>
        </main>

        {showLogTerminal && (
          <LogTerminal
            onClose={() =>
              setShowLogTerminal(false)
            }
          />
        )}
      </div>
    )
  }

  const resultItems =
    getResultRoiItems()

  const songStartItems =
    getSongStartRoiItems()

  const currentRoiItems =
    roiSubTab === 'result'
      ? resultItems
      : songStartItems

  const currentImage =
    roiSubTab === 'result'
      ? resultSample
      : songStartSample

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#03050a] text-zinc-100">
      <SystemSidebar
        onSettings={() => undefined}
        onTerminal={() =>
          setShowLogTerminal(
            (open) => !open,
          )
        }
        terminalOpen={
          showLogTerminal
        }
        section={{
          index: '00',
          label: 'SETTINGS',
        }}
      />

      <main className="relative min-h-0 flex-1 overflow-y-auto lg:pl-18">
        <SystemBackground />

        <div className="relative">
          <SystemPageHeader
            label="SETTINGS"
            onBack={requestClose}
          />

          <div className="mx-auto max-w-350 px-6 py-6">
            <div className="mb-6 flex gap-2 border-b border-zinc-900 pb-2">
              <TabButton
                active={
                  activeTab === 'main'
                }
                index="01"
                label="MAIN"
                onClick={() =>
                  requestTabChange(
                    'main',
                  )
                }
              />

              <TabButton
                active={
                  activeTab ===
                  'advanced'
                }
                index="02"
                label="ADVANCED"
                onClick={() =>
                  requestTabChange(
                    'advanced',
                  )
                }
              />

              <TabButton
                active={
                  activeTab ===
                  'screen_areas'
                }
                index="03"
                label="SCREEN AREAS"
                onClick={() =>
                  requestTabChange(
                    'screen_areas',
                  )
                }
              />
            </div>

            {activeTab === 'main' && (
              <div className="space-y-5">
                <SettingCard
                  title="INPUT"
                  description="User input and recording trigger"
                >
                  <div className="grid gap-5 lg:grid-cols-2">
                    <label className="space-y-2">
                      <SettingLabel>
                        Trigger Key
                      </SettingLabel>

                      <KeyInput
                        value={
                          config.input
                            .trigger_key
                        }
                        listening={
                          listeningForKey
                        }
                        onStart={() => {
                          setError(null)
                          setMessage(null)
                          setListeningForKey(
                            true,
                          )
                        }}
                      />

                      <SettingHint>
                        リザルト画面で押下することでプレイ動画を保存します。ESCキーで設定をキャンセルします。
                      </SettingHint>
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Minimum Score
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.play_log
                            .min_score
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              play_log: {
                                ...current.play_log,
                                min_score:
                                  value,
                              },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        自動でプレイ記録を保存するスコアの下限です。
                      </SettingHint>
                    </label>
                  </div>
                </SettingCard>

                <SettingCard
                  title="LOGGING"
                  description="Application log output"
                >
                  <label className="block max-w-md space-y-2">
                    <SettingLabel>
                      Log Level
                    </SettingLabel>

                    <SelectInput
                      value={
                        config.logging
                          .level
                      }
                      options={LOG_LEVELS}
                      onChange={(value) =>
                        updateConfig(
                          (current) => ({
                            ...current,
                            logging: {
                              ...current.logging,
                              level:
                                value as LogLevel,
                            },
                          }),
                        )
                      }
                    />

                    <SettingHint>
                      出力するログの最低レベルです。DEBUGにすると詳細なデバッグログも出力されます。
                    </SettingHint>
                  </label>
                </SettingCard>

                <SettingCard
                  title="OBS"
                  description="OBS Studio executable and scene"
                >
                  <div className="space-y-5">
                    <label className="block space-y-2">
                      <SettingLabel>
                        OBS Executable
                      </SettingLabel>

                      <PathInput
                        value={
                          config.obs
                            .executable_path
                        }
                        onBrowse={() =>
                          browseFile(
                            config.obs
                              .executable_path,
                            ['exe'],
                          )
                        }
                      />

                      <SettingHint>
                        OBS Studioの実行ファイルの場所です。OBSを通常と異なる場所にインストールした場合のみ変更してください。
                      </SettingHint>
                    </label>

                    <label className="block space-y-2">
                      <SettingLabel>
                        OBS Scene
                      </SettingLabel>

                      <TextInput
                        value={
                          config.obs
                            .scene_name
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              obs: {
                                ...current.obs,
                                scene_name:
                                  value,
                              },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        Replay Bufferの録画に使用するOBSシーン名です。OBS側でシーン名を変更した場合は、ここも同じ名前にしてください。
                      </SettingHint>
                    </label>
                  </div>
                </SettingCard>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetMain}
                    className="flex items-center gap-2 border border-zinc-800 px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 transition hover:border-cyan-400/50 hover:text-cyan-300"
                  >
                    <RotateCcw
                      size={14}
                    />
                    RESET MAIN
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-5">
                <SettingCard
                  title="OBS WEBSOCKET"
                  description="OBS WebSocket connection parameters"
                >
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="space-y-2">
                      <SettingLabel>
                        Host
                      </SettingLabel>

                      <TextInput
                        value={
                          config.obs
                            .websocket
                            .host
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              obs: {
                                ...current.obs,
                                websocket: {
                                  ...current
                                    .obs
                                    .websocket,
                                  host: value,
                                },
                              },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        OBS WebSocketへ接続するホスト名です。<br />
                        OBSと同じPCで使用する場合は通常変更不要です。
                      </SettingHint>
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Port
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.obs
                            .websocket
                            .port
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              obs: {
                                ...current.obs,
                                websocket: {
                                  ...current
                                    .obs
                                    .websocket,
                                  port: value,
                                },
                              },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        OBS WebSocketの接続ポートです。<br />
                        OBSのWebSocket設定でポートを変更した場合に、同じ値に変更してください。
                      </SettingHint>
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Timeout Seconds
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.obs
                            .websocket
                            .timeout_seconds
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              obs: {
                                ...current.obs,
                                websocket: {
                                  ...current
                                    .obs
                                    .websocket,
                                  timeout_seconds:
                                    value,
                                },
                              },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        OBS WebSocketへの接続・応答を待つ最大時間です。<br />
                        OBSの起動直後に接続タイムアウトが発生する場合は値を大きくしてください。
                      </SettingHint>
                    </label>
                  </div>
                </SettingCard>

                <SettingCard
                  title="RESULT DETECTION"
                  description="Result screen detection parameters"
                >
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="space-y-2">
                      <SettingLabel>
                        Threshold
                      </SettingLabel>

                      <NumberInput
                        value={
                          config
                            .result_detection
                            .threshold
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              result_detection:
                                {
                                  ...current.result_detection,
                                  threshold:
                                    value,
                                },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        リザルト画面を検出する時のテンプレート画像との一致度下限です。<br />
                        検出できない場合は下げ、誤検出が起きる場合は上げてください。
                      </SettingHint>
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Interval Seconds
                      </SettingLabel>

                      <NumberInput
                        value={
                          config
                            .result_detection
                            .interval_seconds
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              result_detection:
                                {
                                  ...current.result_detection,
                                  interval_seconds:
                                    value,
                                },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        リザルト画面の検出を行う間隔です。<br />
                        小さくするとより正確なタイミングで検出できますが、負荷が高まります。
                      </SettingHint>
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Scale
                      </SettingLabel>

                      <NumberInput
                        value={
                          config
                            .result_detection
                            .scale
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              result_detection:
                                {
                                  ...current.result_detection,
                                  scale:
                                    value,
                                },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        リザルト検出時に画像を縮小する倍率です。<br />
                        倍率を下げると負荷を抑えられますが、検出精度が下がる可能性があります。
                      </SettingHint>
                    </label>
                  </div>
                </SettingCard>

                <SettingCard
                  title="SONG START DETECTION"
                  description="Replay song start detection parameters"
                >
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="space-y-2">
                      <SettingLabel>
                        Threshold
                      </SettingLabel>

                      <NumberInput
                        value={
                          config
                            .song_start_detection
                            .threshold
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              song_start_detection:
                                {
                                  ...current.song_start_detection,
                                  threshold:
                                    value,
                                },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        曲開始タイミングを検出する時のテンプレート画像との一致度下限です。<br />
                        検出できない場合は下げ、誤検出が起きる場合は上げてください。
                      </SettingHint>
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Interval Seconds
                      </SettingLabel>

                      <NumberInput
                        value={
                          config
                            .song_start_detection
                            .interval_seconds
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              song_start_detection:
                                {
                                  ...current.song_start_detection,
                                  interval_seconds:
                                    value,
                                },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        曲開始タイミングの検出を行う間隔です。<br />
                        小さくするとより正確なタイミングで検出できますが、負荷が高まります。
                      </SettingHint>
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Scale
                      </SettingLabel>

                      <NumberInput
                        value={
                          config
                            .song_start_detection
                            .scale
                        }
                        onChange={(value) =>
                          updateConfig(
                            (current) => ({
                              ...current,
                              song_start_detection:
                                {
                                  ...current.song_start_detection,
                                  scale:
                                    value,
                                },
                            }),
                          )
                        }
                      />

                      <SettingHint>
                        曲開始タイミングの検出時に画像を縮小する倍率です。<br />
                        倍率を下げると負荷を抑えられますが、検出精度が下がる可能性があります。
                      </SettingHint>
                    </label>
                  </div>
                </SettingCard>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetAdvanced}
                    className="flex items-center gap-2 border border-zinc-800 px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 transition hover:border-cyan-400/50 hover:text-cyan-300"
                  >
                    <RotateCcw
                      size={14}
                    />
                    RESET ADVANCED
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'screen_areas' && (
              <div>
                <div className="grid grid-cols-2 border border-zinc-900 bg-[#05080d]">
                  <RoiSubTabButton
                    active={
                      roiSubTab === 'result'
                    }
                    label="RESULT"
                    icon={<ScanLine size={15} />}
                    onClick={() => {
                      setRoiSubTab('result')
                      setSelectedRoiId(null)
                    }}
                  />

                  <RoiSubTabButton
                    active={
                      roiSubTab === 'song_start'
                    }
                    label="SONG START"
                    icon={<PlayCircle size={15} />}
                    onClick={() => {
                      setRoiSubTab('song_start')
                      setSelectedRoiId(null)
                    }}
                  />
                </div>
                <SettingCard
                  title={
                    roiSubTab === 'result'
                      ? 'RESULT'
                      : 'SONG START'
                  }
                  description={
                    roiSubTab === 'result'
                      ? 'Result screen detection and OCR regions'
                      : 'Song start detection region'
                  }
                >
                  <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
                    <div className="min-h-0">
                      {currentImage && (
                        <RoiEditor
                          image={currentImage}
                          items={currentRoiItems}
                          selectedId={selectedRoiId}
                          onSelect={
                            setSelectedRoiId
                          }
                          onChange={updateRoi}
                          onChangeStart={() => {
                            if (
                              !roiEditActiveRef.current
                            ) {
                              pushRoiHistory()
                              roiEditActiveRef.current = true
                            }
                          }}
                          onChangeEnd={() => {
                            roiEditActiveRef.current = false
                          }}
                          onChangeImage={() =>
                            chooseSample(
                              roiSubTab,
                            )
                          }
                        />
                      )}
                    </div>

                    <div className="min-h-0 h-200 overflow-y-auto pr-1">
                      <RoiList
                        items={currentRoiItems}
                        selectedId={selectedRoiId}
                        onSelect={
                          setSelectedRoiId
                        }
                        onChange={updateRoi}
                      />
                    </div>
                  </div>
                </SettingCard>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={resetRoi}
                    className="flex items-center gap-2 border border-zinc-800 px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 transition hover:border-cyan-400/50 hover:text-cyan-300"
                  >
                    <RotateCcw
                      size={14}
                    />
                    RESET SCREEN AREAS
                  </button>
                </div>
              </div>
            )}

            {(message || error) && (
              <div
                className={`mt-5 border p-4 font-mono text-sm ${
                  error
                    ? 'border-red-500/20 bg-red-500/5 text-red-300'
                    : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                }`}
              >
                {error ?? message}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-zinc-900 pt-5">
              <div>
                {isDirty && (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">
                    UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={
                  saving ||
                  !isDirty
                }
                onClick={save}
                className="group relative flex items-center gap-2 overflow-hidden border border-cyan-400/40 bg-cyan-400/5 px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.24em] text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="absolute left-0 top-0 h-px w-8 bg-cyan-400 transition-all group-hover:w-full" />

                <Save
                  size={16}
                  strokeWidth={1.8}
                />

                {saving
                  ? 'SAVING...'
                  : 'SAVE SETTINGS'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <MessageDialog
        open={settingsDialog?.type === 'unsaved-close'}
        icon={AlertTriangle}
        title="UNSAVED CHANGES"
        message="保存されていない設定があります。"
        description="変更を保存して設定画面を閉じますか？"
        error={error}
        actions={[
          {
            label: 'SAVE',
            accent: 'cyan',
            loading: saving,
            loadingLabel: 'SAVING...',
            onClick: () => {
              void (async () => {
                const saved = await performSave()

                if (saved) {
                  setSettingsDialog(null)
                  onBack()
                }
              })()
            },
          },
          {
            label: "DON'T SAVE",
            accent: 'zinc',
            onClick: () => {
              setSettingsDialog(null)
              discardChanges()
              onBack()
            },
          },
          {
            label: 'CANCEL',
            accent: 'zinc',
            onClick: () => {
              setSettingsDialog(null)
            },
          },
        ]}
      />

      <MessageDialog
        open={settingsDialog?.type === 'unsaved-tab'}
        icon={AlertTriangle}
        title="UNSAVED CHANGES"
        message="保存されていない設定があります。"
        description="変更を保存してタブを切り替えますか？"
        error={error}
        actions={[
          {
            label: 'SAVE',
            accent: 'cyan',
            loading: saving,
            loadingLabel: 'SAVING...',
            onClick: () => {
              if (
                settingsDialog?.type !== 'unsaved-tab'
              ) {
                return
              }

              const nextTab =
                settingsDialog.nextTab

              void (async () => {
                const saved = await performSave()

                if (saved) {
                  setSettingsDialog(null)
                  setActiveTab(nextTab)
                }
              })()
            },
          },
          {
            label: "DON'T SAVE",
            accent: 'zinc',
            onClick: () => {
              if (
                settingsDialog?.type !== 'unsaved-tab'
              ) {
                return
              }

              const nextTab =
                settingsDialog.nextTab

              setSettingsDialog(null)
              discardChanges()
              setActiveTab(nextTab)
            },
          },
          {
            label: 'CANCEL',
            accent: 'zinc',
            onClick: () => {
              setSettingsDialog(null)
            },
          },
        ]}
      />

      <MessageDialog
        open={settingsDialog?.type === 'reset-main'}
        icon={RotateCcw}
        title="RESET MAIN SETTINGS"
        accent="red"
        message="MAINの設定を初期値に戻します。"
        description="変更はSAVEするまで反映されません。"
        actions={[
          {
            label: 'RESET',
            accent: 'red',
            onClick: handleResetMain,
          },
          {
            label: 'CANCEL',
            accent: 'zinc',
            onClick: () => {
              setSettingsDialog(null)
            },
          },
        ]}
      />

      <MessageDialog
        open={settingsDialog?.type === 'reset-advanced'}
        icon={RotateCcw}
        title="RESET ADVANCED SETTINGS"
        accent="red"
        message="ADVANCEDの設定を初期値に戻します。"
        description="変更はSAVEするまで反映されません。"
        actions={[
          {
            label: 'RESET',
            accent: 'red',
            onClick: handleResetAdvanced,
          },
          {
            label: 'CANCEL',
            accent: 'zinc',
            onClick: () => {
              setSettingsDialog(null)
            },
          },
        ]}
      />

      <MessageDialog
        open={settingsDialog?.type === 'reset-roi'}
        icon={RotateCcw}
        title="RESET SCREEN AREAS"
        accent="red"
        message="SCREEN AREASの設定とサンプル画像を初期値に戻します。"
        description="変更はSAVEするまで反映されません。"
        actions={[
          {
            label: 'RESET',
            accent: 'red',
            onClick: handleResetRoi,
          },
          {
            label: 'CANCEL',
            accent: 'zinc',
            onClick: () => {
              setSettingsDialog(null)
            },
          },
        ]}
      />

      {showLogTerminal && (
        <LogTerminal
          onClose={() =>
            setShowLogTerminal(false)
          }
        />
      )}
    </div>
  )
}
