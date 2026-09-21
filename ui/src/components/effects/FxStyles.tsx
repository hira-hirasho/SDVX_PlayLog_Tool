export function FxStyles() {
  return (
    <style>{`
      @keyframes plg-grid-drift {
        0% {
          background-position: 0 0, 0 0;
        }
        50% {
          background-position: 20px 20px, -20px 20px;
        }
        100% {
          background-position: 40px 40px, 0 40px;
        }
      }

      @keyframes plg-ambient-cyan {
        0% {
          transform: translate3d(-8%, -4%, 0) scale(0.9);
          opacity: 0.10;
        }
        35% {
          transform: translate3d(8%, 5%, 0) scale(1.05);
          opacity: 0.16;
        }
        70% {
          transform: translate3d(18%, -3%, 0) scale(1.12);
          opacity: 0.11;
        }
        100% {
          transform: translate3d(-8%, -4%, 0) scale(0.9);
          opacity: 0.10;
        }
      }

      @keyframes plg-ambient-magenta {
        0% {
          transform: translate3d(8%, 5%, 0) scale(1);
          opacity: 0.08;
        }
        30% {
          transform: translate3d(-8%, -2%, 0) scale(1.08);
          opacity: 0.13;
        }
        65% {
          transform: translate3d(-18%, 6%, 0) scale(0.94);
          opacity: 0.10;
        }
        100% {
          transform: translate3d(8%, 5%, 0) scale(1);
          opacity: 0.08;
        }
      }

      @keyframes plg-depth-pulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.35;
        }
        50% {
          transform: scale(1.08);
          opacity: 0.65;
        }
      }

      @keyframes plg-orbit {
        0% {
          transform: rotate(0deg) translateX(3%);
        }
        50% {
          transform: rotate(180deg) translateX(-3%);
        }
        100% {
          transform: rotate(360deg) translateX(3%);
        }
      }

      @keyframes plg-scan-y {
        0% {
          transform: translateY(-15vh);
          opacity: 0;
        }
        12% {
          opacity: 0.35;
        }
        50% {
          opacity: 0.15;
        }
        88% {
          opacity: 0.35;
        }
        100% {
          transform: translateY(115vh);
          opacity: 0;
        }
      }

      @keyframes plg-glow-pulse {
        0%,
        100% {
          opacity: 0.45;
        }
        50% {
          opacity: 1;
        }
      }

      @keyframes plg-stamp-in {
        0% {
          opacity: 0;
          transform: scale(1.4) rotate(-2deg);
        }
        55% {
          opacity: 1;
          transform: scale(0.94) rotate(0.5deg);
        }
        100% {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
      }

      @keyframes plg-fade-in-block {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes plg-page-in {
        from {
          opacity: 0;
          transform: scale(0.985);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .plg-grid-anim {
        animation: plg-grid-drift 14s ease-in-out infinite alternate;
      }

      .plg-ambient-cyan {
        animation: plg-ambient-cyan 18s ease-in-out infinite;
      }

      .plg-ambient-magenta {
        animation: plg-ambient-magenta 23s ease-in-out infinite;
      }

      .plg-depth-pulse {
        animation: plg-depth-pulse 8s ease-in-out infinite;
      }

      .plg-orbit {
        animation: plg-orbit 30s linear infinite;
      }

      .plg-scan-line {
        animation: plg-scan-y 7s linear infinite;
      }

      .plg-glow-pulse {
        animation: plg-glow-pulse 2.8s ease-in-out infinite;
      }

      .plg-stamp-in {
        animation: plg-stamp-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .plg-fade-in-block {
        animation: plg-fade-in-block 0.3s ease-out both;
      }

      .plg-page-in {
        animation: plg-page-in 0.35s ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .plg-grid-anim,
        .plg-ambient-cyan,
        .plg-ambient-magenta,
        .plg-depth-pulse,
        .plg-orbit,
        .plg-scan-line,
        .plg-glow-pulse,
        .plg-stamp-in,
        .plg-fade-in-block,
        .plg-page-in {
          animation: none !important;
        }
      }
    `}</style>
  )
}
