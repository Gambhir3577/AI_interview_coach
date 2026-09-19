import React from 'react';

/**
 * Creative Animated AI Interview Coach Pro Logo
 * Features: Multi-ring rotating orbital energy, glowing neural waveform core, radiant gradient fill, and badge.
 */
export function Logo({ size = 'medium', showBadge = true, showSubtitle = true, onClick }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const iconDim = isLarge ? 54 : isSmall ? 36 : 44;

  return (
    <div
      onClick={onClick}
      className="brand-logo-container"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isLarge ? '14px' : isSmall ? '10px' : '12px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Animated Holographic Emblem Icon */}
      <div
        className="brand-emblem-wrap"
        style={{
          width: iconDim,
          height: iconDim,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: isLarge ? '16px' : '12px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 0 25px rgba(99, 102, 241, 0.35), inset 0 0 15px rgba(236, 72, 153, 0.2)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Pulsing Glow Backdrop */}
        <div className="logo-glow-layer" />

        {/* Rotating Orbital SVG Rings */}
        <svg
          width={iconDim}
          height={iconDim}
          viewBox="0 0 100 100"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Orbital Ring (Counter-Clockwise) */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth="2.5"
            strokeDasharray="6 14 10 18"
            className="logo-ring-outer"
          />

          {/* Middle Dashed Orbit (Clockwise) */}
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            className="logo-ring-inner"
          />

          {/* Center Neural AI Node */}
          <g filter="url(#neonGlow)">
            {/* Dynamic Sound Wave Arcs */}
            <path
              d="M 32 50 Q 41 32, 50 50 T 68 50"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="logo-wave-1"
            />
            <path
              d="M 36 50 Q 43 62, 50 50 T 64 50"
              fill="none"
              stroke="#f472b6"
              strokeWidth="2"
              strokeLinecap="round"
              className="logo-wave-2"
            />

            {/* Neural Diamond Core */}
            <circle cx="50" cy="50" r="6" fill="url(#coreGrad)" className="logo-core-pulse" />
            <circle cx="50" cy="50" r="12" fill="none" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
          </g>
        </svg>

        {/* Dynamic Light Sweep Flare */}
        <div className="logo-light-sweep" />
      </div>

      {/* Brand Typography & Tagline */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: isLarge ? '1.75rem' : isSmall ? '1.1rem' : '1.3rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: '#ffffff',
              fontFamily: 'var(--font-heading)'
            }}
          >
            AI Interview <span className="gradient-text-animated">Coach Pro</span>
          </span>

          {showBadge && (
            <span
              className="logo-pro-badge"
              style={{
                fontSize: isLarge ? '0.72rem' : '0.62rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)',
                color: '#e0e7ff',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)',
                letterSpacing: '0.05em'
              }}
            >
              PRO 2.0
            </span>
          )}
        </div>

        {showSubtitle && (
          <span
            style={{
              fontSize: isLarge ? '0.85rem' : isSmall ? '0.7rem' : '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              marginTop: '1px'
            }}
          >
            Multimodal Voice, Vision, STAR & Career AI
          </span>
        )}
      </div>
    </div>
  );
}
