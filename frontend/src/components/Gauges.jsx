import React from 'react';

/**
 * Animated Circular Score Gauge
 */
export function CircularScoreGauge({
  value = 75,
  max = 100,
  size = 140,
  strokeWidth = 10,
  color = '#6366f1',
  unit = '',
  label = '',
  sublabel = ''
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(max, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / max) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: `drop-shadow(0 0 6px ${color}80)`
            }}
          />
        </svg>

        {/* Center Text */}
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
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: size > 110 ? '1.8rem' : '1.3rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
            {clampedValue}
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{unit}</span>
          </div>
          {sublabel && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {sublabel}
            </div>
          )}
        </div>
      </div>

      {label && (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Visual WPM Speedometer
 */
export function WpmSpeedometer({ wpm = 135, status = 'Ideal Pace' }) {
  const minWpm = 60;
  const maxWpm = 220;
  const clampedWpm = Math.max(minWpm, Math.min(maxWpm, wpm));
  const normalized = (clampedWpm - minWpm) / (maxWpm - minWpm);
  const angle = -90 + normalized * 180; // -90 deg (left) to +90 deg (right)

  let needleColor = '#34d399';
  if (wpm < 110 || wpm > 180) {
    needleColor = '#f43f5e';
  } else if (wpm < 120 || wpm > 160) {
    needleColor = '#fbbf24';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '240px' }}>
      <div style={{ position: 'relative', width: 180, height: 95, overflow: 'hidden' }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Slow Zone (60 - 120) */}
          <path
            d="M 20 90 A 70 70 0 0 1 55 35"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="10"
            strokeOpacity="0.4"
          />
          {/* Ideal Zone (120 - 160) */}
          <path
            d="M 55 35 A 70 70 0 0 1 125 35"
            fill="none"
            stroke="#10b981"
            strokeWidth="12"
            strokeOpacity="0.9"
            style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' }}
          />
          {/* Fast Zone (160 - 220) */}
          <path
            d="M 125 35 A 70 70 0 0 1 160 90"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="10"
            strokeOpacity="0.4"
          />
        </svg>

        {/* Pivot Pin */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
            zIndex: 3
          }}
        />

        {/* Needle */}
        <div
          style={{
            position: 'absolute',
            bottom: 7,
            left: '50%',
            width: 3,
            height: 60,
            backgroundColor: needleColor,
            borderRadius: '2px',
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: `0 0 8px ${needleColor}`,
            zIndex: 2
          }}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: '6px' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
          {wpm} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>WPM</span>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: needleColor,
            marginTop: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {status}
        </div>
      </div>
    </div>
  );
}

/**
 * Pressure Round Countdown Timer Dial
 */
export function PressureTimerDial({
  timeLeftSeconds = 60,
  totalLimitSeconds = 90
}) {
  const size = 90;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, timeLeftSeconds / (totalLimitSeconds || 90)));
  const offset = circumference - ratio * circumference;

  const isWarning = timeLeftSeconds <= 15 && timeLeftSeconds > 0;
  const isOvertime = timeLeftSeconds <= 0;

  const color = isOvertime ? '#f43f5e' : isWarning ? '#f59e0b' : '#6366f1';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
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
            justifyContent: 'center'
          }}
          className={isWarning ? 'pulse-warning' : ''}
        >
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {Math.max(0, timeLeftSeconds)}s
          </span>
          <span style={{ fontSize: '0.62rem', color: isWarning ? '#fbbf24' : 'var(--text-muted)' }}>
            {isOvertime ? 'OVERTIME' : isWarning ? 'WRAPPING' : 'REMAINING'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 4-Pillar Content Radar Breakdown Bar
 */
export function ContentDimensionPillars({
  relevance = 8,
  structure = 8,
  clarity = 7,
  depth = 7
}) {
  const pillars = [
    { label: 'Relevance', score: relevance, color: '#818cf8' },
    { label: 'Structure', score: structure, color: '#c084fc' },
    { label: 'Clarity', score: clarity, color: '#38bdf8' },
    { label: 'Tech/Domain Depth', score: depth, color: '#34d399' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {pillars.map((p) => (
        <div key={p.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{p.label}</span>
            <span style={{ color: p.color, fontWeight: 700 }}>{p.score} / 10</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(p.score / 10) * 100}%`,
                height: '100%',
                background: p.color,
                borderRadius: 4,
                transition: 'width 0.8s ease'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Sampled Gaze & Posture Timeline
 */
export function EngagementTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
        No timeline sampled data available.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
        <span>0:00</span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Gaze & Posture Timeline</span>
        <span>End</span>
      </div>

      <div
        style={{
          display: 'flex',
          height: 14,
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          gap: 1
        }}
      >
        {timeline.map((sample, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              backgroundColor: sample.looking_at_camera ? '#10b981' : '#f43f5e',
              opacity: sample.looking_at_camera ? 0.85 : 0.65,
              transition: 'all 0.15s ease'
            }}
            title={`${sample.timestamp_sec}s: ${sample.looking_at_camera ? 'Looking at camera' : 'Averted gaze / Shifted'}`}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#10b981' }} />
          <span>Camera Aligned</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#f43f5e' }} />
          <span>Averted Gaze</span>
        </div>
      </div>
    </div>
  );
}
