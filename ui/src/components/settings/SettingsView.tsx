import { useEffect, useState, type ReactNode } from 'react'

import { FolderOpen, Keyboard, Save } from 'lucide-react'

import { SystemBackground } from '../effects/SystemBackground'
import { SystemPageHeader } from '../layout/SystemPageHeader'
import { SystemSidebar } from '../layout/SystemSidebar'

type Region = {
  x: number
  y: number
  width: number
  height: number
}

type Config = {
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

type SettingsTab = 'main' | 'advanced' | 'ocr_regions'

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
      onChange={(event) => onChange(Number(event.target.value))}
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
      onChange={(event) => onChange(event.target.value)}
      className="w-full border border-zinc-800 bg-[#05080d] px-3.5 py-3 font-mono text-sm text-zinc-200 outline-none transition focus:border-cyan-400/60"
    />
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

function SettingHint({ children }: { children: ReactNode }) {
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

      <div className="p-6">{children}</div>
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
          {listening ? 'PRESS A KEY...' : value}
        </span>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={listening}
        className="group relative shrink-0 border border-zinc-800 bg-[#070a10] px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 transition hover:border-cyan-400/60 hover:text-cyan-300 disabled:cursor-wait disabled:border-cyan-400/40 disabled:text-cyan-300"
      >
        <span className="absolute left-0 top-0 h-px w-4 bg-cyan-400 transition-all group-hover:w-full" />

        {listening ? 'WAITING...' : 'SET KEY'}
      </button>
    </div>
  )
}

function RegionEditor({
  title,
  region,
  onChange,
}: {
  title: string
  region: Region
  onChange: (region: Region) => void
}) {
  const update = (
    key: keyof Region,
    value: number,
  ) => {
    onChange({
      ...region,
      [key]: value,
    })
  }

  return (
    <div className="border border-zinc-900 bg-[#060910] p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-1 w-1 bg-cyan-400" />

        <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          {title}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
            X
          </span>

          <NumberInput
            value={region.x}
            onChange={(value) => update('x', value)}
          />
        </label>

        <label className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
            Y
          </span>

          <NumberInput
            value={region.y}
            onChange={(value) => update('y', value)}
          />
        </label>

        <label className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
            WIDTH
          </span>

          <NumberInput
            value={region.width}
            onChange={(value) => update('width', value)}
          />
        </label>

        <label className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
            HEIGHT
          </span>

          <NumberInput
            value={region.height}
            onChange={(value) => update('height', value)}
          />
        </label>
      </div>
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
          active ? 'text-cyan-400' : 'text-zinc-700'
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

export function SettingsView({
  onBack,
}: SettingsViewProps) {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] =
    useState<SettingsTab>('main')
  const [listeningForKey, setListeningForKey] =
    useState(false)

  useEffect(() => {
    document.documentElement.style.overflowY = 'scroll'

    return () => {
      document.documentElement.style.overflowY = ''
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const result = await window.api.getConfig()

        if (!cancelled) {
          setConfig(result as Config)
        }
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

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
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
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [listeningForKey])

  const updateConfig = (
    updater: (current: Config) => Config,
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
            executable_path: selectedPath.replace(/\\/g, '/'),
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

  const save = async () => {
    if (!config) {
      return
    }

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      await window.api.saveConfig(config)

      setMessage(
        '設定を保存しました。変更はバックエンド再起動後に反映されます。',
      )
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : '設定の保存に失敗しました。',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#03050a] text-zinc-100">
      <SystemSidebar
        onSettings={() => undefined}
        section={{
          index: '00',
          label: 'SETTINGS',
        }}
      />

      <main className="relative min-h-screen lg:pl-18">
        <SystemBackground />

        <div className="relative">
          <SystemPageHeader
            label="SETTINGS"
            onBack={onBack}
          />

          <div className="mx-auto max-w-350 px-6 py-6">
            {loading ? (
              <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
                <span className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                  LOADING SETTINGS...
                </span>
              </div>
            ) : !config ? (
              <div className="mx-auto max-w-5xl border border-red-500/20 bg-red-500/5 p-6">
                <span className="font-mono text-xs text-red-300">
                  {error ?? '設定を読み込めませんでした。'}
                </span>
              </div>
            ) : (
              <>
                <div className="mb-6 flex gap-2 border-b border-zinc-900 pb-2">
                  <TabButton
                    active={activeTab === 'main'}
                    index="01"
                    label="MAIN"
                    onClick={() => setActiveTab('main')}
                  />

                  <TabButton
                    active={activeTab === 'advanced'}
                    index="02"
                    label="ADVANCED"
                    onClick={() => setActiveTab('advanced')}
                  />

                  <TabButton
                    active={activeTab === 'ocr_regions'}
                    index="03"
                    label="OCR REGIONS"
                    onClick={() => setActiveTab('ocr_regions')}
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
                            value={config.input.trigger_key}
                            listening={listeningForKey}
                            onStart={() => {
                              setError(null)
                              setMessage(null)
                              setListeningForKey(true)
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
                            value={config.play_log.min_score}
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                play_log: {
                                  ...current.play_log,
                                  min_score: value,
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            自動でプレイ記録を保存するスコアの下限です。
                          </SettingHint>
                        </label>
                      </div>
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
                            value={config.obs.executable_path}
                            onBrowse={() =>
                              browseFile(
                                config.obs.executable_path,
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
                            value={config.obs.scene_name}
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                obs: {
                                  ...current.obs,
                                  scene_name: value,
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            Replay Bufferの録画に使用するOBSシーン名です。OBS側でシーン名を変更した場合は、ここも同じ名前にしてください。
                          </SettingHint>
                        </label>
                      </div>
                    </SettingCard>
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
                            value={config.obs.websocket.host}
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                obs: {
                                  ...current.obs,
                                  websocket: {
                                    ...current.obs.websocket,
                                    host: value,
                                  },
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            OBS WebSocketへ接続するホスト名です。<br></br>
                            OBSと同じPCで使用する場合は通常変更不要です。
                          </SettingHint>
                        </label>

                        <label className="space-y-2">
                          <SettingLabel>
                            Port
                          </SettingLabel>

                          <NumberInput
                            value={config.obs.websocket.port}
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                obs: {
                                  ...current.obs,
                                  websocket: {
                                    ...current.obs.websocket,
                                    port: value,
                                  },
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            OBS WebSocketの接続ポートです。<br></br>
                            OBSのWebSocket設定でポートを変更した場合に、同じ値に変更してください。
                          </SettingHint>
                        </label>

                        <label className="space-y-2">
                          <SettingLabel>
                            Timeout Seconds
                          </SettingLabel>

                          <NumberInput
                            value={
                              config.obs.websocket.timeout_seconds
                            }
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                obs: {
                                  ...current.obs,
                                  websocket: {
                                    ...current.obs.websocket,
                                    timeout_seconds: value,
                                  },
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            OBS WebSocketへの接続・応答を待つ最大時間です。<br></br>
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
                            value={config.result_detection.threshold}
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                result_detection: {
                                  ...current.result_detection,
                                  threshold: value,
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            リザルト画面を検出する時のテンプレート画像との一致度下限です。<br></br>
                            検出できない場合は下げ、誤検出が起きる場合は上げてください。
                          </SettingHint>
                        </label>

                        <label className="space-y-2">
                          <SettingLabel>
                            Interval Seconds
                          </SettingLabel>

                          <NumberInput
                            value={
                              config.result_detection.interval_seconds
                            }
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                result_detection: {
                                  ...current.result_detection,
                                  interval_seconds: value,
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            リザルト画面の検出を行う間隔です。<br></br>
                            小さくするとより正確なタイミングで検出できますが、画面キャプチャと画像処理の頻度が増え、負荷が高まります。
                          </SettingHint>
                        </label>

                        <label className="space-y-2">
                          <SettingLabel>
                            Scale
                          </SettingLabel>

                          <NumberInput
                            value={config.result_detection.scale}
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                result_detection: {
                                  ...current.result_detection,
                                  scale: value,
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            リザルト検出時に画像を縮小する倍率です。<br></br>
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
                              config.song_start_detection.threshold
                            }
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                song_start_detection: {
                                  ...current.song_start_detection,
                                  threshold: value,
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            曲開始タイミングを検出する時のテンプレート画像との一致度下限です。<br></br>
                            検出できない場合は下げ、誤検出が起きる場合は上げてください。
                          </SettingHint>
                        </label>

                        <label className="space-y-2">
                          <SettingLabel>
                            Interval Seconds
                          </SettingLabel>

                          <NumberInput
                            value={
                              config.song_start_detection.interval_seconds
                            }
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                song_start_detection: {
                                  ...current.song_start_detection,
                                  interval_seconds: value,
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            曲開始タイミングの検出を行う間隔です。<br></br>
                            小さくするとより正確なタイミングで検出できますが、画面キャプチャと画像処理の頻度が増え、負荷が高まります。
                          </SettingHint>
                        </label>

                        <label className="space-y-2">
                          <SettingLabel>
                            Scale
                          </SettingLabel>

                          <NumberInput
                            value={
                              config.song_start_detection.scale
                            }
                            onChange={(value) =>
                              updateConfig((current) => ({
                                ...current,
                                song_start_detection: {
                                  ...current.song_start_detection,
                                  scale: value,
                                },
                              }))
                            }
                          />

                          <SettingHint>
                            曲開始タイミングの検出時に画像を縮小する倍率です。<br></br>
                            倍率を下げると負荷を抑えられますが、検出精度が下がる可能性があります。
                          </SettingHint>
                        </label>
                      </div>
                    </SettingCard>
                  </div>
                )}

                {activeTab === 'ocr_regions' && (
                  <div className="space-y-3">
                    <RegionEditor
                      title="RESULT DETECTION"
                      region={config.result_detection.region}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          result_detection: {
                            ...current.result_detection,
                            region,
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="SONG START DETECTION"
                      region={config.song_start_detection.region}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          song_start_detection: {
                            ...current.song_start_detection,
                            region,
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="SONG NAME"
                      region={config.ocr.regions.song_name}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              song_name: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="ARTIST"
                      region={config.ocr.regions.artist}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              artist: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="DIFFICULTY / LEVEL"
                      region={config.ocr.regions.difficulty_level}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              difficulty_level: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="CLEAR TYPE"
                      region={config.ocr.regions.clear_type}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              clear_type: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="RATE TYPE"
                      region={config.ocr.regions.rate_type}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              rate_type: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="SCORE"
                      region={config.ocr.regions.score}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              score: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="SCORE DELTA"
                      region={config.ocr.regions.score_delta}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              score_delta: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="EX SCORE"
                      region={config.ocr.regions.ex_score}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              ex_score: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="EX SCORE DELTA"
                      region={config.ocr.regions.ex_score_delta}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              ex_score_delta: region,
                            },
                          },
                        }))
                      }
                    />
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

                <div className="mt-5 flex justify-end border-t border-zinc-900 pt-5">
                  <button
                    type="button"
                    disabled={saving}
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
