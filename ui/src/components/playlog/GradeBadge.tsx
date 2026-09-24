type Props = {
  grade: string | null
  color: string
  size?: number
}

export function GradeBadge({
  grade,
  color,
  size,
}: Props) {
  const badgeSize = size ?? 48
  const id = `grade-${grade ?? 'empty'}-${color.replace('#', '')}`

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{
        width: size ?? 48,
        height: size ?? 48,
      }}
      aria-label={grade ?? '-'}
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
              stopColor={color}
            />
            <stop
              offset="80%"
              stopColor={color}
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
            stroke={color}
            strokeWidth="2"
            opacity="0.35"
            filter={`url(#${id}-glow)`}
          />

          {/* 外側フレーム */}
          <polygon
            points="32,2 58.846,17.5 58.846,46.5 32,62 5.154,46.5 5.154,17.5"
            fill="#05070a"
            stroke="#020304"
            strokeWidth="2"
          />

          {/* メインカラーリング */}
          <polygon
            points="32,5 56.248,19 56.248,45 32,59 7.752,45 7.752,19"
            fill="none"
            stroke={`url(#${id}-ring)`}
            strokeWidth="4"
          />

          {/* リング内側 */}
          <polygon
            points="32,9 52.784,21 52.784,43 32,55 11.216,43 11.216,21"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.8"
          />

          {/* 内側六角形 */}
          <polygon
            points="32,11 51.052,22 51.052,42 32,53 12.948,42 12.948,22"
            fill={`url(#${id}-inner)`}
            stroke="#68737d"
            strokeWidth="1"
          />

          {/* 内側カラーライン */}
          <polygon
            points="32,14 48.454,23.5 48.454,40.5 32,50 15.546,40.5 15.546,23.5"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.55"
          />
        </g>
      </svg>

      <span
        className="relative z-10 flex items-center justify-center font-mono font-black leading-none"
        style={{
          color: '#ffffff',
          fontSize: badgeSize * 0.4375,
          textShadow: `
            0 0 1px #000,
            0 0 2px #000,
            0 0 4px ${color},
            0 0 8px ${color}99
          `,
        }}
      >
        {grade || '-'}
      </span>
    </span>
  )
}
