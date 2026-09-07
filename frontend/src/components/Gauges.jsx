import React from 'react';

/**
 * Circular Score Gauge with glowing SVG stroke
 */
export function CircularScoreGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  label = 'Score',
  color = '#6366f1',
  unit = '',
  sublabel = ''
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value || 0, 0), max);
  const strokeDashoffset = circumference - (normalizedValue / max) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${color}80)`
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: size * 0.24, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#f8fafc' }}>
            {value}
            <span style={{ fontSize: size * 0.14, color: 'var(--text-secondary)' }}>{unit}</span>
          </span>
          {sublabel && (
            <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </div>
  );
}


/**
 * Speedometer Gauge for Speaking Pace (WPM)
 */
export function WpmSpeedometer({ wpm = 0, status = 'Ideal Pace' }) {
  // Speedometer ranges from 0 to 220 WPM
  const minWpm = 0;
  const maxWpm = 220;
  const clampedWpm = Math.min(Math.max(wpm, minWpm), maxWpm);

  // Map 0 -> 220 WPM to angle -90deg to +90deg (180 deg total)
  const angle = -90 + (clampedWpm / maxWpm) * 180;

  // Determine status color
  let statusColor = '#10b981'; // green
  if (status.includes('Slow')) statusColor = '#f59e0b';
  if (status.includes('Too Fast') || status.includes('Too Slow')) statusColor = '#f43f5e';
  if (status.includes('Fast') && !status.includes('Too')) statusColor = '#f59e0b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 220, height: 125, overflow: 'hidden' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />     {/* Too Slow */}
              <stop offset="45%" stopColor="#f59e0b" />    {/* Slightly Slow */}
              <stop offset="55%" stopColor="#10b981" />    {/* Ideal */}
              <stop offset="75%" stopColor="#10b981" />    {/* Ideal */}
              <stop offset="85%" stopColor="#f59e0b" />    {/* Slightly Fast */}
              <stop offset="100%" stopColor="#f43f5e" />   {/* Too Fast */}
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 25 110 A 85 85 0 0 1 195 110"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Color Gradient Track */}
          <path
            d="M 25 110 A 85 85 0 0 1 195 110"
            fill="none"
            stroke="url(#speedGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            style={{ opacity: 0.85 }}
          />

          {/* Ideal Range Highlight Marker (120 - 160 WPM: approx 54% to 72% of 180deg) */}
          <path
            d="M 90 30 A 85 85 0 0 1 140 37"
            fill="none"
            stroke="#34d399"
            strokeWidth="4"
            style={{ filter: 'drop-shadow(0 0 4px #10b981)' }}
          />

          {/* Needle */}
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '110px 110px', transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <line
              x1="110"
              y1="110"
              x2="110"
              y2="36"
              stroke="#f8fafc"
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
            />
            <circle cx="110" cy="110" r="7" fill="#6366f1" stroke="#f8fafc" strokeWidth="2" />
          </g>
        </svg>
      </div>

      <div style={{ textAlign: 'center', marginTop: -5 }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#f8fafc' }}>
          {wpm} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>WPM</span>
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 4,
            padding: '3px 12px',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            backgroundColor: `${statusColor}20`,
            color: statusColor,
            border: `1px solid ${statusColor}40`
          }}
        >
          {status}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Target: 120 – 160 WPM
        </div>
      </div>
    </div>
  );
}


/**
 * Eye Contact Timeline Visualization Bar
 */
export function EngagementTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div style={{ width: '100%', marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
        <span>0s (Start)</span>
        <span>Timeline Engagement Sample</span>
        <span>{timeline[timeline.length - 1]?.timestamp_sec || 0}s (End)</span>
      </div>
      <div
        style={{
          display: 'flex',
          height: 14,
          borderRadius: 6,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          gap: 1
        }}
      >
        {timeline.map((sample, idx) => (
          <div
            key={idx}
            title={`${sample.timestamp_sec}s: ${sample.looking_at_camera ? 'Looking at camera' : 'Looked away'}`}
            style={{
              flex: 1,
              backgroundColor: sample.looking_at_camera ? '#10b981' : '#f43f5e',
              opacity: sample.looking_at_camera ? 0.9 : 0.6,
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
          <span>Looking at camera</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f43f5e' }} />
          <span>Looked away</span>
        </div>
      </div>
    </div>
  );
}
