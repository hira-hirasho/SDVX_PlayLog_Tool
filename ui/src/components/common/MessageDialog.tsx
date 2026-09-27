import type { LucideIcon } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

type MessageDialogAccent =
  | 'cyan'
  | 'fuchsia'
  | 'red'
  | 'zinc'

type MessageDialogButton = {
  label: string
  onClick: () => void
  accent?: MessageDialogAccent
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
}

type MessageDialogProps = {
  open: boolean
  title: string
  icon?: LucideIcon
  accent?: MessageDialogAccent

  message?: ReactNode
  description?: ReactNode
  detail?: ReactNode
  error?: ReactNode

  children?: ReactNode
  actions?: MessageDialogButton[]
}

const accentIconClasses: Record<
  MessageDialogAccent,
  string
> = {
  cyan: 'text-cyan-300',
  fuchsia: 'text-fuchsia-300',
  red: 'text-red-300',
  zinc: 'text-zinc-300',
}

const accentButtonClasses: Record<
  MessageDialogAccent,
  string
> = {
  cyan:
    'border-cyan-400/50 bg-cyan-400/5 text-cyan-300 hover:bg-cyan-400/10',
  fuchsia:
    'border-fuchsia-400/50 bg-fuchsia-400/5 text-fuchsia-300 hover:bg-fuchsia-400/10',
  red:
    'border-red-400/50 bg-red-400/5 text-red-300 hover:bg-red-400/10',
  zinc:
    'border-zinc-600 bg-zinc-800/20 text-zinc-300 hover:bg-zinc-800/40',
}

function renderButton(button: MessageDialogButton) {
  const {
    label,
    onClick,
    accent = 'cyan',
    disabled = false,
    loading = false,
    loadingLabel,
  } = button

  const className = `border px-4 py-2 font-mono text-xs tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
    accent === 'zinc'
      ? accentButtonClasses.zinc
      : accentButtonClasses[accent]
  }`

  return (
    <button
      key={label}
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
    >
      {loading
        ? loadingLabel ?? 'PROCESSING...'
        : label}
    </button>
  )
}

let systemSoundContext: AudioContext | null = null
let systemSoundBufferPromise: Promise<AudioBuffer> | null = null

async function playSystemSound() {
  systemSoundContext ??= new AudioContext()

  if (!systemSoundBufferPromise) {
    systemSoundBufferPromise = window.api
      .getSystemSound()
      .then((base64) => {
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)

        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i)
        }

        return systemSoundContext!.decodeAudioData(
          bytes.buffer,
        )
      })
  }

  const buffer = await systemSoundBufferPromise

  if (systemSoundContext.state === 'suspended') {
    await systemSoundContext.resume()
  }

  const source =
    systemSoundContext.createBufferSource()

  source.buffer = buffer
  source.connect(systemSoundContext.destination)
  source.start()
}

export function MessageDialog({
  open,
  title,
  icon: Icon,
  accent = 'cyan',
  message,
  description,
  detail,
  error,
  children,
  actions,
}: MessageDialogProps) {
  useEffect(() => {
    if (!open) {
      return
    }
  
    void playSystemSound()
  }, [open])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md border border-zinc-700 bg-[#070a10] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
          {Icon && (
            <Icon
              size={18}
              className={accentIconClasses[accent]}
            />
          )}

          <span className="font-mono text-sm tracking-[0.18em] text-zinc-200">
            {title}
          </span>
        </div>

        <div className="px-6 py-6">
          {message && (
            <p className="font-mono text-sm text-zinc-200">
              {message}
            </p>
          )}

          {description && (
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {description}
            </p>
          )}

          {detail && (
            <p className="mt-2 text-xs leading-5 text-zinc-600">
              {detail}
            </p>
          )}

          {error && (
            <p className="mt-4 border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          {children}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">
            {actions.map(renderButton)}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
