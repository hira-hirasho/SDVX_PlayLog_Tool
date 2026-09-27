import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  ImagePlus,
} from 'lucide-react'
  
export type RoiRegion = {
  x: number
  y: number
  width: number
  height: number
}

export type RoiItem = {
  id: string
  label: string
  region: RoiRegion
}

type RoiEditorProps = {
  image: string
  items: RoiItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (
    id: string,
    region: RoiRegion,
  ) => void
  onChangeStart: () => void
  onChangeEnd: () => void
  onChangeImage: () => void
}

const IMAGE_WIDTH = 1080
const IMAGE_HEIGHT = 1920
const MIN_SIZE = 20
const MIN_ZOOM = 0.05
const MAX_ZOOM = 10
const RESIZE_HIT = 5

type ResizeDirection =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw'
  | null

type Point = {
  x: number
  y: number
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(Math.max(value, min), max)
}

function getResizeDirection(
  localX: number,
  localY: number,
  region: RoiRegion,
): ResizeDirection {
  const left = localX <= RESIZE_HIT
  const right =
    localX >= region.width - RESIZE_HIT
  const top = localY <= RESIZE_HIT
  const bottom =
    localY >= region.height - RESIZE_HIT

  if (top && left) return 'nw'
  if (top && right) return 'ne'
  if (bottom && left) return 'sw'
  if (bottom && right) return 'se'
  if (top) return 'n'
  if (bottom) return 's'
  if (left) return 'w'
  if (right) return 'e'

  return null
}

function getCursor(
  direction: ResizeDirection,
): string {
  switch (direction) {
    case 'n':
    case 's':
      return 'ns-resize'

    case 'e':
    case 'w':
      return 'ew-resize'

    case 'nw':
    case 'se':
      return 'nwse-resize'

    case 'ne':
    case 'sw':
      return 'nesw-resize'

    default:
      return 'move'
  }
}

export function RoiEditor({
  image,
  items,
  selectedId,
  onSelect,
  onChange,
  onChangeStart,
  onChangeEnd,
  onChangeImage,
}: RoiEditorProps) {
  const viewportRef =
    useRef<HTMLDivElement | null>(null)

  const [viewportSize, setViewportSize] =
    useState({
      width: 0,
      height: 0,
    })

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({
    x: 0,
    y: 0,
  })

  const fitInitializedRef = useRef(false)

  const dragRef = useRef<{
    mode: 'pan' | 'move' | 'resize'
    roiId: string | null
    direction: ResizeDirection
    startPointer: Point
    startPan: Point
    startRegion: RoiRegion | null
    changed: boolean
  } | null>(null)

  useEffect(() => {
    const element = viewportRef.current
  
    if (!element) {
      return
    }
  
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
  
      if (!entry) {
        return
      }
  
      const width = entry.contentRect.width
      const height = entry.contentRect.height
  
      setViewportSize({
        width,
        height,
      })
  
      if (
        !fitInitializedRef.current &&
        width > 0 &&
        height > 0
      ) {
        const horizontal =
          width / IMAGE_WIDTH
        const vertical =
          height / IMAGE_HEIGHT
  
        const nextZoom =
          Math.min(horizontal, vertical)
  
        setZoom(nextZoom)
  
        setPan({
          x:
            (width -
              IMAGE_WIDTH * nextZoom) /
            2,
          y:
            (height -
              IMAGE_HEIGHT * nextZoom) /
            2,
        })
  
        fitInitializedRef.current = true
      }
    })
  
    observer.observe(element)
  
    return () => observer.disconnect()
  }, [])

  const clampPan = useCallback(
    (
      nextPan: Point,
      nextZoom: number,
    ): Point => {
      const width =
        IMAGE_WIDTH * nextZoom
      const height =
        IMAGE_HEIGHT * nextZoom
  
      const margin = 80
  
      let x = nextPan.x
      let y = nextPan.y
  
      if (width <= viewportSize.width) {
        const center =
          (viewportSize.width - width) / 2
  
        x = clamp(
          x,
          center - margin,
          center + margin,
        )
      } else {
        x = clamp(
          x,
          viewportSize.width -
            width -
            margin,
          margin,
        )
      }
  
      if (height <= viewportSize.height) {
        const center =
          (viewportSize.height - height) / 2
  
        y = clamp(
          y,
          center - margin,
          center + margin,
        )
      } else {
        y = clamp(
          y,
          viewportSize.height -
            height -
            margin,
          margin,
        )
      }
  
      return { x, y }
    },
    [
      viewportSize.width,
      viewportSize.height,
    ],
  )

  useEffect(() => {
    const element = viewportRef.current
  
    if (!element) {
      return
    }
  
    const handleNativeWheel = (
      event: WheelEvent,
    ) => {
      event.preventDefault()
      event.stopPropagation()
  
      const rect =
        element.getBoundingClientRect()
  
      const mouseX =
        event.clientX - rect.left
      const mouseY =
        event.clientY - rect.top
  
      const imageX =
        (mouseX - pan.x) / zoom
      const imageY =
        (mouseY - pan.y) / zoom
  
      const factor =
        event.deltaY < 0 ? 1.1 : 1 / 1.1
  
      const nextZoom = clamp(
        zoom * factor,
        MIN_ZOOM,
        MAX_ZOOM,
      )
  
      const nextPan = clampPan(
        {
          x:
            mouseX -
            imageX * nextZoom,
          y:
            mouseY -
            imageY * nextZoom,
        },
        nextZoom,
      )
  
      setZoom(nextZoom)
      setPan(nextPan)
    }
  
    element.addEventListener(
      'wheel',
      handleNativeWheel,
      { passive: false },
    )
  
    return () => {
      element.removeEventListener(
        'wheel',
        handleNativeWheel,
      )
    }
  }, [
    pan,
    zoom,
    viewportSize,
    clampPan,
  ])

  const toImagePoint = (
    clientX: number,
    clientY: number,
  ): Point => {
    const rect =
      viewportRef.current?.getBoundingClientRect()

    if (!rect) {
      return { x: 0, y: 0 }
    }

    return {
      x:
        (clientX -
          rect.left -
          pan.x) /
        zoom,
      y:
        (clientY -
          rect.top -
          pan.y) /
        zoom,
    }
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    item: RoiItem | null,
  ) => {
    if (event.button !== 0) {
      return
    }

    const imagePoint = toImagePoint(
      event.clientX,
      event.clientY,
    )

    if (
      event.altKey ||
      !item
    ) {
      dragRef.current = {
        mode: 'pan',
        roiId: null,
        direction: null,
        startPointer: {
          x: event.clientX,
          y: event.clientY,
        },
        startPan: pan,
        startRegion: null,
        changed: false,
      }

      event.currentTarget.setPointerCapture(
        event.pointerId,
      )

      return
    }

    onSelect(item.id)
    onChangeStart()

    const localX =
      imagePoint.x - item.region.x
    const localY =
      imagePoint.y - item.region.y

    const direction =
      getResizeDirection(
        localX,
        localY,
        item.region,
      )

    dragRef.current = {
      mode: direction
        ? 'resize'
        : 'move',
      roiId: item.id,
      direction,
      startPointer: {
        x: event.clientX,
        y: event.clientY,
      },
      startPan: pan,
      startRegion: {
        ...item.region,
      },
      changed: false,
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    )
  }

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current

    if (!drag) {
      return
    }

    const dx =
      (event.clientX -
        drag.startPointer.x) /
      zoom

    const dy =
      (event.clientY -
        drag.startPointer.y) /
      zoom

    if (drag.mode === 'pan') {
      setPan(
        clampPan(
          {
            x: drag.startPan.x +
              (event.clientX -
                drag.startPointer.x),
            y: drag.startPan.y +
              (event.clientY -
                drag.startPointer.y),
          },
          zoom,
        ),
      )

      return
    }

    if (
      !drag.roiId ||
      !drag.startRegion
    ) {
      return
    }

    const start = drag.startRegion

    let next: RoiRegion = {
      ...start,
    }

    if (drag.mode === 'move') {
      next.x = Math.round(
        start.x + dx,
      )
      next.y = Math.round(
        start.y + dy,
      )

      next.x = clamp(
        next.x,
        0,
        IMAGE_WIDTH - start.width,
      )

      next.y = clamp(
        next.y,
        0,
        IMAGE_HEIGHT - start.height,
      )
    } else {
      const direction =
        drag.direction

      let left = start.x
      let top = start.y
      let right =
        start.x + start.width
      let bottom =
        start.y + start.height

      if (direction?.includes('w')) {
        left = clamp(
          Math.round(start.x + dx),
          0,
          right - MIN_SIZE,
        )
      }

      if (direction?.includes('e')) {
        right = clamp(
          Math.round(
            start.x +
              start.width +
              dx,
          ),
          left + MIN_SIZE,
          IMAGE_WIDTH,
        )
      }

      if (direction?.includes('n')) {
        top = clamp(
          Math.round(start.y + dy),
          0,
          bottom - MIN_SIZE,
        )
      }

      if (direction?.includes('s')) {
        bottom = clamp(
          Math.round(
            start.y +
              start.height +
              dy,
          ),
          top + MIN_SIZE,
          IMAGE_HEIGHT,
        )
      }

      next = {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      }
    }

    if (
      drag.mode === 'move' ||
      drag.mode === 'resize'
    ) {
      if (
        drag.roiId &&
        drag.startRegion &&
        (
          drag.startRegion.x !== next.x ||
          drag.startRegion.y !== next.y ||
          drag.startRegion.width !== next.width ||
          drag.startRegion.height !== next.height
        )
      ) {
        if (!drag.changed) {
          drag.changed = true
          onChangeStart()
        }
      }
    }

    onChange(drag.roiId, next)
  }

  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current
  
    if (
      drag?.changed
    ) {
      onChangeEnd()
    }
  
    dragRef.current = null
  
    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      )
    }
  }

  const handleBackgroundPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    onSelect(null)
    handlePointerDown(event, null)
  }

  return (
    <div className="flex h-200 min-h-0 flex-col border border-zinc-900 bg-[#04070b]">
      <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
        <span className="font-mono text-xs font-bold text-cyan-300">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-hidden bg-[#020408]"
        onPointerDown={
          handleBackgroundPointerDown
        }
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          minHeight: 720,
        }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            transform:
              `translate3d(${pan.x}px, ${pan.y}px, 0) ` +
              `scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <img
            src={image}
            alt=""
            draggable={false}
            className="absolute left-0 top-0 h-[1920px] w-270 select-none"
            onDragStart={(event) =>
              event.preventDefault()
            }
          />

          {items.map((item, index) => {
            const selected =
              item.id === selectedId

            return (
              <div
                key={item.id}
                className="absolute"
                style={{
                  left: item.region.x,
                  top: item.region.y,
                  width: item.region.width,
                  height: item.region.height,
                  zIndex: index + 1,
                  border: '1px solid rgb(34 211 238 / 0.75)',
                  background: selected
                    ? 'rgb(34 211 238 / 0.08)'
                    : 'rgb(34 211 238 / 0.025)',
                  cursor: 'move',
                  boxSizing: 'border-box',
                }}
                onPointerDown={(event) => {
                  event.stopPropagation()
                
                  handlePointerDown(
                    event,
                    item,
                  )
                }}
                onPointerMove={(event) => {
                  if (
                    dragRef.current
                  ) {
                    return
                  }

                  const rect =
                    event.currentTarget.getBoundingClientRect()

                  const localX =
                    (event.clientX -
                      rect.left) /
                    zoom

                  const localY =
                    (event.clientY -
                      rect.top) /
                    zoom

                  const direction =
                    getResizeDirection(
                      localX,
                      localY,
                      item.region,
                    )

                  event.currentTarget.style.cursor =
                    getCursor(direction)
                }}
              >
                <span
                  className="pointer-events-none absolute bottom-full -left-px mb-px whitespace-nowrap bg-[#020408]/90 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    fontSize: `${Math.max(4, 10 / zoom)}px`,
                    paddingLeft: `${6 / zoom}px`,
                    paddingRight: `${6 / zoom}px`,
                    paddingTop: `${2 / zoom}px`,
                    paddingBottom: `${2 / zoom}px`,
                    color: selected ? 'rgb(255 255 255)' : 'rgb(103 232 249)',
                    background: selected
                      ? 'rgb(8 145 178 / 0.85)'
                      : 'rgb(2 4 8 / 0.9)',
                  }}
                >
                  {selected && '▸ '}
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex h-13 items-center justify-between border-t border-zinc-900 px-4">
        <button
          type="button"
          onClick={onChangeImage}
          className="flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 transition hover:border-cyan-400/50 hover:text-cyan-300"
        >
          <ImagePlus size={13} />
          CHANGE
        </button>

        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
          WHEEL: ZOOM / ALT + DRAG: PAN
        </span>
      </div>
    </div>
  )
}
