import type { ClearType, RateType } from '../../types/playLog'

type Props = {
  value: ClearType | null
  rateType: RateType | null
  size?: number
}

type BadgeStyle = {
  label: string
  color: string
  opacity: number
}

function getBadgeStyle(
  value: ClearType,
  rateType: RateType | null,
): BadgeStyle {
  switch (value) {
    case 'COMPLETE':
      switch (rateType) {
        case 'EXCESSIVE RATE':
          return {
            label: 'COMP',
            color: '#D63FFA',
            opacity: 1,
          }

        case 'MAXXIVE RATE':
          return {
            label: 'COMP',
            color: '#DFE4F6',
            opacity: 1,
          }

        case 'EFFECTIVE RATE':
        default:
          return {
            label: 'COMP',
            color: '#41FE9E',
            opacity: 1,
          }
      }

    case 'ULTIMATECHAIN':
      return {
        label: 'UC',
        color: '#FF3FAF',
        opacity: 1,
      }

    case 'PERFECT':
      return {
        label: 'PUC',
        color: '#F8FA3D',
        opacity: 1,
      }

    case 'CRASH':
      return {
        label: 'COMP',
        color: '#41FE9E',
        opacity: 0.45,
      }
  }
}

export function ClearTypeBadge({
  value,
  rateType,
  size,
}: Props) {
  if (!value) {
    return null
  }

  const style = getBadgeStyle(value, rateType)
  const badgeSize = size ?? 48
  const id = `clear-type-${value}-${style.color.replace('#', '')}`

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{
        width: size ?? 48,
        height: size ?? 48,
      }}
      aria-label={value}
    >
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={`${id}-glow`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur
              stdDeviation="2"
              result="blur"
            />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient
            id={`${id}-ring`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#ffffff"
              stopOpacity="0.75"
            />
            <stop
              offset="20%"
              stopColor={style.color}
            />
            <stop
              offset="80%"
              stopColor={style.color}
              stopOpacity="0.9"
            />
            <stop
              offset="100%"
              stopColor="#11151a"
            />
          </linearGradient>

          <linearGradient
            id={`${id}-inner`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#2b333b"
            />
            <stop
              offset="50%"
              stopColor="#11161b"
            />
            <stop
              offset="100%"
              stopColor="#05070a"
            />
          </linearGradient>
        </defs>

        <g transform="rotate(30 32 32)">
          {/* 外側グロー */}
          <polygon
            points="32,1 58.846,16.5 58.846,47.5 32,63 5.154,47.5 5.154,16.5"
            fill="none"
            stroke={style.color}
            strokeWidth="2"
            opacity={style.opacity * 0.35}
            filter={`url(#${id}-glow)`}
          />

          {/* 外側フレーム */}
          <polygon
            points="32,2 58.846,17.5 58.846,46.5 32,62 5.154,46.5 5.154,17.5"
            fill="#05070a"
            stroke="#020304"
            strokeWidth="2"
            opacity={style.opacity}
          />

          {/* メインカラーリング */}
          <polygon
            points="32,5 56.248,19 56.248,45 32,59 7.752,45 7.752,19"
            fill="none"
            stroke={`url(#${id}-ring)`}
            strokeWidth="4"
            opacity={style.opacity}
          />

          {/* リング内側 */}
          <polygon
            points="32,9 52.784,21 52.784,43 32,55 11.216,43 11.216,21"
            fill="none"
            stroke={style.color}
            strokeWidth="1"
            opacity={style.opacity * 0.8}
          />

          {/* 内側六角形 */}
          <polygon
            points="32,11 51.052,22 51.052,42 32,53 12.948,42 12.948,22"
            fill={`url(#${id}-inner)`}
            stroke="#68737d"
            strokeWidth="1"
            opacity={style.opacity}
          />

          {/* 内側カラーライン */}
          <polygon
            points="32,14 48.454,23.5 48.454,40.5 32,50 15.546,40.5 15.546,23.5"
            fill="none"
            stroke={style.color}
            strokeWidth="1"
            opacity={style.opacity * 0.55}
          />
        </g>
      </svg>

      {/* 文字 */}
      <span
        className="relative z-10 flex items-center justify-center font-mono font-black leading-none"
        style={{
          color: '#ffffff',
          fontSize:
            badgeSize *
            (style.label === 'COMP' ? 0.3125 : 0.4375),
          letterSpacing:
            style.label === 'COMP'
              ? '0.02em'
              : '0em',
          textShadow: `
            0 0 1px #000,
            0 0 2px #000,
            0 0 4px ${style.color},
            0 0 8px ${style.color}99
          `,
          opacity: style.opacity,
        }}
      >
        {style.label}
      </span>
    </span>
  )
}
