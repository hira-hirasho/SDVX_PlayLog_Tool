import { useEffect, useState } from 'react'
import { ArrowLeft, FolderOpen, Keyboard, Save } from 'lucide-react'

import { FxStyles } from '../effects/FxStyles'
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
    debounce_seconds: number
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

  replay: {
    detection_timeout_seconds: number
    stability_checks: number
    stability_interval_seconds: number
  }

  ocr: {
    max_attempts: number
    regions: {
      song_name: Region
      artist: Region
      difficulty: Region
      level: Region
      score: {
        first: Region
        second: Region
      }
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
      className="w-full border border-zinc-800 bg-[#05080d] px-3 py-2.5 font-mono text-xs text-zinc-200 outline-none transition focus:border-cyan-400/60"
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
      className="w-full border border-zinc-800 bg-[#05080d] px-3 py-2.5 font-mono text-xs text-zinc-200 outline-none transition focus:border-cyan-400/60"
    />
  )
}

function SettingLabel({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </span>
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

          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-zinc-300">
            {title}
          </h2>
        </div>

        {description && (
          <p className="mt-2 pl-9 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-700">
            {description}
          </p>
        )}
      </div>

      <div className="p-5">{children}</div>
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
        className="group relative flex shrink-0 items-center gap-2 border border-zinc-800 bg-[#070a10] px-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500 transition hover:border-cyan-400/60 hover:text-cyan-300"
      >
        <span className="absolute left-0 top-0 h-px w-4 bg-cyan-400 transition-all group-hover:w-full" />

        <FolderOpen
          size={14}
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
        className={`flex min-w-0 flex-1 items-center border px-3 py-2.5 font-mono text-xs ${
          listening
            ? 'border-cyan-400/70 bg-cyan-400/5 text-cyan-300'
            : 'border-zinc-800 bg-[#05080d] text-zinc-300'
        }`}
      >
        <Keyboard
          size={14}
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
        className="group relative shrink-0 border border-zinc-800 bg-[#070a10] px-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500 transition hover:border-cyan-400/60 hover:text-cyan-300 disabled:cursor-wait disabled:border-cyan-400/40 disabled:text-cyan-300"
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

        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          {title}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
            X
          </span>

          <NumberInput
            value={region.x}
            onChange={(value) => update('x', value)}
          />
        </label>

        <label className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
            Y
          </span>

          <NumberInput
            value={region.y}
            onChange={(value) => update('y', value)}
          />
        </label>

        <label className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
            WIDTH
          </span>

          <NumberInput
            value={region.width}
            onChange={(value) => update('width', value)}
          />
        </label>

        <label className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
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
        className={`text-[9px] font-bold tracking-[0.16em] ${
          active ? 'text-cyan-400' : 'text-zinc-700'
        }`}
      >
        {index}
      </span>

      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
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

      if (key.length === 1) {
        key = key.toLowerCase()
      } else {
        key = key.toLowerCase()
      }

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
            executable_path: selectedPath,
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

  if (loading) {
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
          <FxStyles />

          <div className="plg-grid-anim pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[40px_40px] opacity-20" />

          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute left-[18%] top-[8%] h-120 w-120 rounded-full bg-cyan-400/2.5 blur-[120px]" />
            <div className="absolute bottom-[5%] right-[8%] h-96 w-96 rounded-full bg-fuchsia-400/2 blur-[120px]" />
          </div>

          <div className="flex min-h-screen items-center justify-center">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              LOADING SETTINGS...
            </span>
          </div>
        </main>
      </div>
    )
  }

  if (!config) {
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
          <FxStyles />

          <div className="mx-auto max-w-350 px-6 py-8">
            <button
              type="button"
              onClick={onBack}
              className="border border-zinc-800 bg-[#070a10] px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
            >
              ← PLAY LOG
            </button>

            <div className="mx-auto mt-10 max-w-5xl border border-red-500/20 bg-red-500/5 p-6">
              <span className="font-mono text-xs text-red-300">
                {error ?? '設定を読み込めませんでした。'}
              </span>
            </div>
          </div>
        </main>
      </div>
    )
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
        <FxStyles />

        {/* Global animated atmosphere */}
        <div className="plg-grid-anim pointer-events-none fixed inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[40px_40px]" />

        {/* Deep ambient light field */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="plg-ambient-cyan absolute left-[-20%] top-[-25%] h-[90vh] w-[90vw] rounded-full bg-cyan-400/20 blur-[160px]" />

          <div className="plg-ambient-magenta absolute bottom-[-25%] right-[-20%] h-[85vh] w-[85vw] rounded-full bg-fuchsia-500/15 blur-[150px]" />

          {/* Central depth field */}
          <div className="plg-depth-pulse absolute left-1/2 top-1/2 h-[65vh] w-[65vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/5 blur-[110px]" />

          {/* Very slow orbital atmosphere */}
          <div className="plg-orbit absolute left-1/2 top-1/2 h-[75vh] w-[75vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/5" />
        </div>

        {/* Soft vertical system scan */}
        <div className="plg-scan-line pointer-events-none fixed inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/40 to-transparent blur-[1px]" />

        {/* Edge atmosphere */}
        <div className="pointer-events-none fixed inset-0 bg-linear-to-br from-cyan-400/2 via-transparent to-fuchsia-500/3" />

        <div className="pointer-events-none fixed left-0 top-0 h-screen w-px bg-linear-to-b from-cyan-400 via-cyan-400/20 to-transparent" />

        <div className="pointer-events-none fixed right-0 top-0 h-screen w-px bg-linear-to-b from-fuchsia-500 via-fuchsia-500/20 to-transparent" />

        {/* Animated background energy field */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* Moving cyan atmosphere */}
          <div className="plg-orb-cyan absolute left-[-15%] top-[-15%] h-[70vh] w-[70vw] rounded-full bg-cyan-400/20 blur-[140px]" />

          {/* Moving magenta atmosphere */}
          <div className="plg-orb-magenta absolute right-[-15%] bottom-[-15%] h-[65vh] w-[65vw] rounded-full bg-fuchsia-500/20 blur-[130px]" />

          {/* Horizontal energy sweep */}
          <div className="plg-energy-line absolute left-0 top-[28%] h-px w-[75vw] bg-linear-to-r from-transparent via-cyan-300/70 to-transparent blur-[1px]" />

          {/* Reverse energy sweep */}
          <div className="plg-energy-line-reverse absolute right-0 top-[68%] h-px w-[80vw] bg-linear-to-r from-transparent via-fuchsia-400/60 to-transparent blur-[1px]" />

          {/* Fast vertical scan */}
          <div className="plg-scan-line-fast absolute left-[28%] top-0 h-px w-[45vw] rotate-90 bg-linear-to-r from-transparent via-cyan-300/60 to-transparent blur-[1px]" />

          {/* Secondary vertical scan */}
          <div className="plg-scan-line-fast absolute right-[22%] top-0 h-px w-[38vw] rotate-90 bg-linear-to-r from-transparent via-fuchsia-300/50 to-transparent blur-[1px]" />
        </div>

        <div className="relative">
        <header className="relative overflow-hidden border-b border-zinc-900 bg-[#060910]/95">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-cyan-400 via-fuchsia-500 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.4)]" />

            <div className="absolute left-0 top-0 h-20 w-[32%] opacity-30 bg-[linear-gradient(135deg,transparent_0%,transparent_47%,rgba(34,211,238,0.16)_48%,transparent_49%,transparent_58%,rgba(34,211,238,0.07)_59%,transparent_60%)]" />

            <div className="absolute right-0 top-0 h-full w-[45%] opacity-30 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(34,211,238,0.15)_49%,transparent_50%,transparent_58%,rgba(217,70,239,0.12)_59%,transparent_60%)]" />

            <div className="flex items-center">
              <div className="w-[calc((100%-1600px)/2)] shrink-0 pl-6">
                <button
                  type="button"
                  onClick={onBack}
                  className="group relative h-11.5 translate-x-2.25 overflow-hidden border border-zinc-800 bg-[#070a10] px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  <span className="absolute left-0 top-0 h-px w-6 bg-cyan-400 transition-all group-hover:w-full" />
                  <span className="flex h-full items-center gap-3">
                    <ArrowLeft
                      size={18}
                      strokeWidth={2}
                      className="shrink-0 transition-transform group-hover:-translate-x-1"
                    />
                    <span className="leading-none">HISTORY</span>
                  </span>
                </button>
              </div>

              <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
                <div className="flex items-center justify-between gap-6">
                  {/* タイトルロゴ */}
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="h-px w-8 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />

                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.38em] text-cyan-300/80">
                        SOUND VOLTEX
                      </span>

                      <span className="h-1 w-1 bg-fuchsia-400" />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-black italic uppercase tracking-[0.12em] text-white sm:text-3xl">
                        <span className="text-cyan-300">SDVX</span>
                        <span className="mx-2 text-zinc-700">/</span>
                        PLAYLOG
                      </span>

                      <span className="hidden h-px w-12 bg-fuchsia-400/60 sm:block" />

                      <span className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-300 sm:block">
                        SETTINGS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-cyan-400/60 via-zinc-800 to-fuchsia-400/40" />
          </header>

          <div className="mx-auto max-w-350 px-6 py-6">
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

                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                        Press SET KEY, then press the desired key.
                        ESC cancels.
                      </p>
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
                    </label>
                  </div>
                </SettingCard>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-5">
                <SettingCard
                  title="INPUT"
                  description="Input timing"
                >
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="space-y-2">
                      <SettingLabel>
                        Debounce Seconds
                      </SettingLabel>

                      <NumberInput
                        value={config.input.debounce_seconds}
                        onChange={(value) =>
                          updateConfig((current) => ({
                            ...current,
                            input: {
                              ...current.input,
                              debounce_seconds: value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                </SettingCard>

                <SettingCard
                  title="OBS WEBSOCKET"
                  description="OBS WebSocket connection parameters"
                >
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Timeout Seconds
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.obs.websocket
                            .timeout_seconds
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
                    </label>
                  </div>
                </SettingCard>

                <SettingCard
                  title="RESULT DETECTION"
                  description="Result screen detection parameters"
                >
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Interval Seconds
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.result_detection
                            .interval_seconds
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
                    </label>
                  </div>
                </SettingCard>

                <SettingCard
                  title="SONG START DETECTION"
                  description="Replay song start detection parameters"
                >
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="space-y-2">
                      <SettingLabel>
                        Threshold
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.song_start_detection
                            .threshold
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
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Interval Seconds
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.song_start_detection
                            .interval_seconds
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
                    </label>
                  </div>
                </SettingCard>

                <SettingCard
                  title="REPLAY"
                  description="Replay file detection and stability"
                >
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="space-y-2">
                      <SettingLabel>
                        Detection Timeout
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.replay
                            .detection_timeout_seconds
                        }
                        onChange={(value) =>
                          updateConfig((current) => ({
                            ...current,
                            replay: {
                              ...current.replay,
                              detection_timeout_seconds:
                                value,
                            },
                          }))
                        }
                      />
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Stability Checks
                      </SettingLabel>

                      <NumberInput
                        value={config.replay.stability_checks}
                        onChange={(value) =>
                          updateConfig((current) => ({
                            ...current,
                            replay: {
                              ...current.replay,
                              stability_checks: value,
                            },
                          }))
                        }
                      />
                    </label>

                    <label className="space-y-2">
                      <SettingLabel>
                        Stability Interval
                      </SettingLabel>

                      <NumberInput
                        value={
                          config.replay
                            .stability_interval_seconds
                        }
                        onChange={(value) =>
                          updateConfig((current) => ({
                            ...current,
                            replay: {
                              ...current.replay,
                              stability_interval_seconds:
                                value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                </SettingCard>

                <SettingCard
                  title="OCR"
                  description="OCR processing parameters"
                >
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="space-y-2">
                      <SettingLabel>
                        Maximum Attempts
                      </SettingLabel>

                      <NumberInput
                        value={config.ocr.max_attempts}
                        onChange={(value) =>
                          updateConfig((current) => ({
                            ...current,
                            ocr: {
                              ...current.ocr,
                              max_attempts: value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                </SettingCard>
              </div>
            )}

            {activeTab === 'ocr_regions' && (
              <div className="space-y-5">
                <SettingCard
                  title="CAPTURE REGIONS"
                  description="Screen regions used for detection and OCR"
                >
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
                      region={
                        config.song_start_detection.region
                      }
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
                      title="DIFFICULTY"
                      region={config.ocr.regions.difficulty}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              difficulty: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="LEVEL"
                      region={config.ocr.regions.level}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              level: region,
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="SCORE FIRST"
                      region={config.ocr.regions.score.first}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              score: {
                                ...current.ocr.regions.score,
                                first: region,
                              },
                            },
                          },
                        }))
                      }
                    />

                    <RegionEditor
                      title="SCORE SECOND"
                      region={config.ocr.regions.score.second}
                      onChange={(region) =>
                        updateConfig((current) => ({
                          ...current,
                          ocr: {
                            ...current.ocr,
                            regions: {
                              ...current.ocr.regions,
                              score: {
                                ...current.ocr.regions.score,
                                second: region,
                              },
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
                      region={
                        config.ocr.regions.ex_score_delta
                      }
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
                </SettingCard>
              </div>
            )}

            {(message || error) && (
              <div
                className={`mt-5 border p-4 font-mono text-xs ${
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
                className="group relative flex items-center gap-2 overflow-hidden border border-cyan-400/40 bg-cyan-400/5 px-8 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="absolute left-0 top-0 h-px w-8 bg-cyan-400 transition-all group-hover:w-full" />

                <Save
                  size={14}
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
    </div>
  )
}
