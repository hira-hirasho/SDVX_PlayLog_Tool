import { useEffect, useRef, useState } from 'react'
import { Terminal, X } from 'lucide-react'

type Props = {
  onClose: () => void
}

export function LogTerminal({
  onClose,
}: Props) {
  const [fileName, setFileName] = useState('')
  const [content, setContent] = useState('')
  const [exists, setExists] = useState(true)
  const [height, setHeight] = useState(384)

  const outputRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let intervalId: number | null = null

    const openTerminal = async () => {
      const result =
        await window.api.openLogTerminal()

      if (cancelled) {
        return
      }

      setFileName(result.fileName)
      setContent(result.content)
      setExists(result.exists)

      intervalId = window.setInterval(
        async () => {
          const latest =
            await window.api.readLogTerminal()

          if (
            cancelled ||
            !latest
          ) {
            return
          }

          setFileName(latest.fileName)
          setContent(latest.content)
          setExists(latest.exists)
        },
        500,
      )
    }

    void openTerminal()

    return () => {
      cancelled = true

      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }

      void window.api.closeLogTerminal()
    }
  }, [])

  useEffect(() => {
    const element = outputRef.current

    if (!element) {
      return
    }

    element.scrollTop = element.scrollHeight
  }, [content])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) {
        return
      }
  
      const nextHeight = window.innerHeight - event.clientY
  
      setHeight(
        Math.min(
          Math.max(nextHeight, 120),
          Math.min(1000, window.innerHeight - 120),
        ),
      )
    }
  
    const handlePointerUp = () => {
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  return (
    <section
      style={{ height }}
      className="relative flex shrink-0 flex-col border-t border-zinc-800 bg-[#020408] shadow-[0_-8px_30px_rgba(0,0,0,0.45)] lg:ml-18"
    >
      <div
        role="separator"
        aria-label="Resize terminal"
        aria-orientation="horizontal"
        onPointerDown={(event) => {
          event.preventDefault()
          draggingRef.current = true
          document.body.style.cursor = 'ns-resize'
          document.body.style.userSelect = 'none'
        }}
        className="group absolute inset-x-0 top-0 z-10 flex h-2 -translate-y-1/2 cursor-ns-resize items-center justify-center"
      >
        <div className="h-px w-16 bg-zinc-700 transition-colors group-hover:bg-cyan-400/70" />
      </div>

      <div className="absolute left-0 top-0 h-px w-24 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />

      <div className="flex h-9 items-center justify-between border-b border-zinc-900 bg-[#060910] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Terminal
            size={14}
            strokeWidth={1.8}
            className="shrink-0 text-cyan-300"
          />

          <span className="font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            TERMINAL
          </span>

          <span className="h-1 w-1 shrink-0 bg-cyan-400" />

          <span className="truncate font-mono text-[12px] tracking-[0.12em] text-zinc-600">
            {fileName}
          </span>

          {!exists && (
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-amber-400/70">
              FILE NOT FOUND
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close terminal"
          className="group flex h-6 w-6 shrink-0 items-center justify-center text-zinc-600 transition hover:text-cyan-300"
        >
          <X
            size={14}
            strokeWidth={1.8}
          />
        </button>
      </div>

      <div
        ref={outputRef}
        className="min-h-0 flex-1 overflow-auto px-4 py-3"
      >
        {exists ? (
          <pre className="whitespace-pre-wrap wrap-break-word font-mono text-[12px] leading-[1.55] text-zinc-400">
            {content}
          </pre>
        ) : (
          <div className="font-mono text-[12px] leading-relaxed text-zinc-700">
            LOG FILE NOT FOUND
          </div>
        )}
      </div>
    </section>
  )
}
