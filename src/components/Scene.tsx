import { useMemo } from 'react'

interface Flake {
  id: number
  left: number
  size: number
  duration: number
  delay: number
  opacity: number
}

/** 背景场景：远山、雪坡与落雪，纯 SVG + CSS 绘制，不参与交互 */
export default function Scene() {
  const flakes = useMemo<Flake[]>(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: (index * 37 + 11) % 100,
        size: 2 + ((index * 7) % 4),
        duration: 14 + ((index * 5) % 12),
        delay: -((index * 3) % 18),
        opacity: 0.25 + ((index % 5) * 0.14),
      })),
    [],
  )

  return (
    <div className="scene" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="scene-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3dccb" />
            <stop offset="100%" stopColor="#cfc7b2" />
          </linearGradient>
          <linearGradient id="scene-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbc4b0" />
            <stop offset="100%" stopColor="#b0a892" />
          </linearGradient>
          <linearGradient id="scene-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbf7ee" />
            <stop offset="100%" stopColor="#e9e1ce" />
          </linearGradient>
          <radialGradient id="scene-moon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffdf7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fffdf7" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="1128" cy="190" r="150" fill="url(#scene-moon)" />
        <circle cx="1128" cy="190" r="46" fill="#fffdf7" opacity="0.75" />

        {/* 远山 */}
        <path
          d="M0 560 L120 505 L210 540 L320 470 L430 530 L540 462 L660 520 L760 478 L880 532 L980 492 L1100 540 L1220 500 L1330 545 L1440 515 L1440 900 L0 900 Z"
          fill="url(#scene-far)"
          opacity="0.75"
        />
        {/* 近一层山脊 */}
        <path
          d="M0 660 L150 600 L280 650 L390 588 L520 648 L640 600 L770 655 L900 608 L1030 660 L1150 615 L1290 662 L1440 620 L1440 900 L0 900 Z"
          fill="url(#scene-mid)"
          opacity="0.72"
        />
        {/* 雪坡 */}
        <path
          d="M0 790 C240 742 420 806 640 764 C860 722 1080 800 1440 752 L1440 900 L0 900 Z"
          fill="url(#scene-near)"
          opacity="0.9"
        />

        {/* 雪中茅庐 */}
        <g opacity="0.55">
          <rect x="258" y="612" width="54" height="38" fill="#6f6656" />
          <path d="M250 614 L285 584 L320 614 Z" fill="#554d41" />
          <path d="M250 614 L285 584 L320 614 L285 600 Z" fill="#fdfaf3" opacity="0.9" />
          <rect x="277" y="626" width="12" height="11" fill="#f7f1e4" />
        </g>
      </svg>

      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
